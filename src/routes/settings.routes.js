const router = require('express').Router();
const A = require('../auth');
const { ok, fail, asyncH, str, int, EMAIL, SERVICES } = require('../util');

router.use(A.requireAuth);

// GET /api/settings
router.get('/', asyncH(async (req, res) => {
  const out = await A.scope(req, async (c) => {
    const t = (await c.query(
      `SELECT company_name, street, postal_code, city, phone, contact_email,
              services, default_lead_days, restrict_agents, digest_enabled,
              plan, max_customers, max_seats
         FROM tenants WHERE id = current_setting('app.tenant_id')::uuid`)).rows[0];
    const senders = (await c.query(
      'SELECT * FROM sender_addresses ORDER BY is_default DESC, email')).rows;
    const mail = (await c.query(
      `SELECT id, email, imap_host, imap_port, smtp_host, smtp_port, last_sync_at
         FROM mail_accounts ORDER BY created_at LIMIT 1`)).rows[0] || null;
    return { tenant: t, senders, mail_account: mail };
  });
  ok(res, out);
}));

// PATCH /api/settings  (owner only)
router.patch('/', A.requireOwner, asyncH(async (req, res) => {
  const b = req.body || {};
  const sets = [], p = [];
  const push = (col, v) => { p.push(v); sets.push(col + ' = $' + p.length); };
  if (b.company_name !== undefined) push('company_name', str(b.company_name, 160));
  if (b.street !== undefined) push('street', str(b.street, 160));
  if (b.postal_code !== undefined) push('postal_code', str(b.postal_code, 10));
  if (b.city !== undefined) push('city', str(b.city, 80));
  if (b.phone !== undefined) push('phone', str(b.phone, 40));
  if (b.default_lead_days !== undefined) push('default_lead_days', int(b.default_lead_days, 90));
  if (b.restrict_agents !== undefined) push('restrict_agents', !!b.restrict_agents);
  if (b.digest_enabled !== undefined) push('digest_enabled', !!b.digest_enabled);
  if (Array.isArray(b.services)) {
    const clean = b.services.map(s => String(s).slice(0, 40)).filter(Boolean);
    if (clean.length) push('services', clean);
  }
  if (!sets.length) return fail(res, 400, 'nothing_to_update');
  p.push(req.user.tenant_id);
  const r = await A.scope(req, (c) =>
    c.query(`UPDATE tenants SET ${sets.join(',')} WHERE id = $${p.length} RETURNING *`, p));
  ok(res, { ok: true, services: r.rows[0].services });
}));

// Sender addresses
router.post('/senders', A.requireOwner, asyncH(async (req, res) => {
  const email = str(req.body.email, 160);
  if (!email || !EMAIL.test(email)) return fail(res, 400, 'bad_email');
  const r = await A.scope(req, (c) => c.query(
    `INSERT INTO sender_addresses (tenant_id, email, label, is_default)
     VALUES (current_setting('app.tenant_id')::uuid,$1,$2,
             NOT EXISTS (SELECT 1 FROM sender_addresses))
     ON CONFLICT (tenant_id, email) DO NOTHING RETURNING *`,
    [email, str(req.body.label, 80)]));
  ok(res, r.rows[0] || { ok: true });
}));

router.post('/senders/:id/default', A.requireOwner, asyncH(async (req, res) => {
  await A.scope(req, async (c) => {
    await c.query('UPDATE sender_addresses SET is_default = false');
    await c.query('UPDATE sender_addresses SET is_default = true WHERE id=$1', [req.params.id]);
  });
  ok(res);
}));

router.delete('/senders/:id', A.requireOwner, asyncH(async (req, res) => {
  await A.scope(req, (c) => c.query('DELETE FROM sender_addresses WHERE id=$1', [req.params.id]));
  ok(res);
}));

module.exports = router;
