const router = require('express').Router();
const A = require('../auth');
const { raw } = require('../db');
const { ok, fail, asyncH } = require('../util');

// Each plan has a monthly and a yearly option. Yearly is priced at 10x the
// monthly rate (i.e. two months free) — adjust the numbers here and create the
// matching prices in Stripe. Each cycle maps to its own Stripe Price env var.
const PLANS = {
  starter: {
    customers: 100, seats: 1,
    monthly: { price: 39,  env: 'STRIPE_PRICE_STARTER' },
    yearly:  { price: 390, env: 'STRIPE_PRICE_STARTER_YEARLY' }
  },
  growth: {
    customers: 300, seats: 3,
    monthly: { price: 69,  env: 'STRIPE_PRICE_GROWTH' },
    yearly:  { price: 690, env: 'STRIPE_PRICE_GROWTH_YEARLY' }
  },
  pro: {
    customers: 600, seats: 5,
    monthly: { price: 100,  env: 'STRIPE_PRICE_PRO' },
    yearly:  { price: 1000, env: 'STRIPE_PRICE_PRO_YEARLY' }
  }
};
const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
const stripe = () => require('stripe')(process.env.STRIPE_SECRET_KEY);

router.get('/plans', (_req, res) => {
  // Flatten for the UI: expose customers/seats plus both cycle prices.
  const out = {};
  for (const [name, p] of Object.entries(PLANS)) {
    out[name] = {
      customers: p.customers,
      seats: p.seats,
      monthly: p.monthly.price,
      yearly: p.yearly.price
    };
  }
  ok(res, { plans: out, enabled: stripeEnabled() });
});

// POST /api/billing/checkout { plan, cycle }
router.post('/checkout', A.requireAuth, A.requireOwner, asyncH(async (req, res) => {
  const plan = PLANS[req.body.plan];
  if (!plan) return fail(res, 400, 'unknown_plan');
  const cycle = req.body.cycle === 'yearly' ? 'yearly' : 'monthly';
  if (!stripeEnabled()) return fail(res, 501, 'billing_not_configured');
  const priceId = process.env[plan[cycle].env];
  if (!priceId) return fail(res, 501, 'price_id_missing');

  const s = stripe();
  let customerId = null;
  const t = await A.scope(req, (c) => c.query(
    `SELECT stripe_customer_id, company_name, contact_email FROM tenants
      WHERE id = current_setting('app.tenant_id')::uuid`));
  customerId = t.rows[0].stripe_customer_id;
  if (!customerId) {
    const cus = await s.customers.create({
      name: t.rows[0].company_name,
      email: t.rows[0].contact_email || req.user.email,
      metadata: { tenant_id: req.user.tenant_id }
    });
    customerId = cus.id;
    await A.scope(req, (c) => c.query(
      `UPDATE tenants SET stripe_customer_id=$1 WHERE id = current_setting('app.tenant_id')::uuid`,
      [customerId]));
  }
  const base = process.env.APP_URL || '';
  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Let Stripe present every payment method you've enabled in the
    // Stripe Dashboard that is eligible for this customer/currency —
    // for a German (EUR) account that includes SEPA-Lastschrift, cards,
    // and (where available) Giropay, Klarna, and others. Manage which
    // ones appear under Settings → Payment methods in Stripe; no code
    // change is needed to add or remove a method.
    automatic_payment_methods: { enabled: true },
    billing_address_collection: 'auto',
    success_url: base + '/?billing=ok',
    cancel_url: base + '/?billing=cancel',
    metadata: { tenant_id: req.user.tenant_id, plan: req.body.plan, cycle: cycle }
  });
  ok(res, { url: session.url });
}));

// POST /api/billing/portal
router.post('/portal', A.requireAuth, A.requireOwner, asyncH(async (req, res) => {
  if (!stripeEnabled()) return fail(res, 501, 'billing_not_configured');
  const t = await A.scope(req, (c) => c.query(
    `SELECT stripe_customer_id FROM tenants WHERE id = current_setting('app.tenant_id')::uuid`));
  const cid = t.rows[0].stripe_customer_id;
  if (!cid) return fail(res, 400, 'no_customer');
  const p = await stripe().billingPortal.sessions.create({
    customer: cid, return_url: (process.env.APP_URL || '') + '/'
  });
  ok(res, { url: p.url });
}));

/**
 * Stripe webhook. Mounted with a raw body parser in server.js.
 * Updates the plan and its limits, and never deletes anything on failure —
 * a past-due account becomes read-only, not erased.
 */
router.post('/webhook', asyncH(async (req, res) => {
  if (!stripeEnabled()) return res.status(200).send('disabled');
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = secret
      ? stripe().webhooks.constructEvent(req.body, sig, secret)
      : JSON.parse(req.body.toString());
  } catch (e) {
    return res.status(400).send('bad signature');
  }

  const obj = event.data && event.data.object;
  const tenantId = (obj && obj.metadata && obj.metadata.tenant_id) || null;

  async function setPlan(name, status, periodEnd, subId) {
    const p = PLANS[name];
    await raw(
      `UPDATE tenants SET plan=$1, status=$2, max_customers=$3, max_seats=$4,
              current_period_end=$5, stripe_subscription_id=coalesce($6, stripe_subscription_id)
        WHERE id=$7 OR stripe_customer_id=$8`,
      [name, status, p ? p.customers : 100, p ? p.seats : 1,
       periodEnd ? new Date(periodEnd * 1000) : null, subId,
       tenantId, (obj && obj.customer) || null]);
  }

  if (event.type === 'checkout.session.completed') {
    await setPlan(obj.metadata && obj.metadata.plan, 'active', null, obj.subscription);
  } else if (event.type === 'customer.subscription.updated' ||
             event.type === 'customer.subscription.created') {
    const nick = obj.items && obj.items.data[0] && obj.items.data[0].price &&
      (obj.items.data[0].price.nickname || '').toLowerCase();
    const status = obj.status === 'active' || obj.status === 'trialing' ? 'active'
      : obj.status === 'past_due' ? 'past_due' : 'suspended';
    await setPlan(PLANS[nick] ? nick : undefined, status, obj.current_period_end, obj.id);
  } else if (event.type === 'customer.subscription.deleted') {
    await raw(`UPDATE tenants SET status='cancelled' WHERE stripe_customer_id=$1`, [obj.customer]);
  } else if (event.type === 'invoice.payment_failed') {
    await raw(`UPDATE tenants SET status='past_due' WHERE stripe_customer_id=$1`, [obj.customer]);
  }
  res.json({ received: true });
}));

module.exports = router;
module.exports.PLANS = PLANS;
