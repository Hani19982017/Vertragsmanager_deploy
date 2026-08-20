const router = require('express').Router();
const { pool, raw, withTenant } = require('../db');
const A = require('../auth');
const crypto = require('crypto');
const M = require('../mailer');
const { authenticator } = require('otplib');
// Allow +/- one 30s step of clock drift between the server and the user's
// phone. With the default window of 0 a valid code fails whenever the two
// clocks are even slightly out of sync, which shows up as "bad_code" on
// otherwise-correct codes. window:1 accepts the current, previous and next
// step (~30s tolerance either side) — the common production setting.
authenticator.options = { window: 1 };
const { ok, fail, asyncH, EMAIL, str } = require('../util');

// POST /api/auth/signup — creates a tenant and its owner
router.post('/signup', asyncH(async (req, res) => {
  const company = str(req.body.company, 160);
  const name = str(req.body.name, 120);
  const email = str(req.body.email, 160);
  const pw = String(req.body.password || '');

  if (!company || !name || !email) return fail(res, 400, 'missing_fields');
  if (!EMAIL.test(email)) return fail(res, 400, 'bad_email');
  if (pw.length < 8) return fail(res, 400, 'weak_password');

  const dup = await raw('SELECT auth_email_exists($1) AS x', [email]);
  if (dup.rows[0].x) return fail(res, 409, 'email_taken');

  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const t = await c.query(
      `INSERT INTO tenants (company_name, contact_email, status, trial_ends_at)
       VALUES ($1,$2,'trial', now() + interval '15 days') RETURNING *`,
      [company, email]
    );
    const tenant = t.rows[0];
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenant.id]);
    const u = await c.query(
      `INSERT INTO users (tenant_id, name, email, role, status, password_hash)
       VALUES ($1,$2,$3,'owner','active',$4) RETURNING *`,
      [tenant.id, name, email, await A.hash(pw)]
    );
    await c.query('COMMIT');
    A.issue(res, u.rows[0]);
    ok(res, { ok: true });
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { c.release(); }
}));

// POST /api/auth/login
router.post('/login', asyncH(async (req, res) => {
  const email = str(req.body.email, 160);
  const pw = String(req.body.password || '');
  if (!email || !pw) return fail(res, 400, 'missing_fields');

  const r = await raw('SELECT * FROM auth_find_user($1)', [email]);
  const u = r.rows[0];
  if (!u || !u.password_hash) return fail(res, 401, 'bad_credentials');
  if (u.status !== 'active') return fail(res, 403, 'account_disabled');
  if (!(await A.verify(pw, u.password_hash))) return fail(res, 401, 'bad_credentials');

  if (u.totp_enabled) {
    const code = String(req.body.code || '');
    if (!code) return fail(res, 401, 'totp_required');
    if (!authenticator.check(code, u.totp_secret || '')) return fail(res, 401, 'bad_code');
  }

  await raw('SELECT auth_touch_login($1)', [u.id]);

  A.issue(res, u);
  ok(res, { ok: true });
}));

router.post('/logout', (req, res) => { A.clear(res); ok(res); });

// GET /api/auth/me
router.get('/me', A.requireAuth, asyncH(async (req, res) => {
  const u = req.user;
  const counts = await A.scope(req, async (c) => {
    const a = await c.query('SELECT count(*)::int n FROM customers WHERE is_active');
    const b = await c.query(
      "SELECT count(*)::int n FROM users WHERE status <> 'disabled' AND tenant_id = current_setting('app.tenant_id')::uuid");
    return { customers: a.rows[0].n, seats: b.rows[0].n };
  });
  const left = u.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(u.trial_ends_at) - new Date()) / 86400000))
    : null;
  ok(res, {
    id: u.id, name: u.name, email: u.email, role: u.role, locale: u.locale,
    company: u.company_name, plan: u.plan, tenantStatus: u.tenant_status,
    maxCustomers: u.max_customers, maxSeats: u.max_seats,
    restrictAgents: u.restrict_agents, defaultLeadDays: u.default_lead_days,
    trialDaysLeft: left, usage: counts
  });
}));


// ---------------- password reset ----------------

// POST /api/auth/forgot { email }  — always answers ok, never leaks existence
router.post('/forgot', asyncH(async (req, res) => {
  const email = str(req.body.email, 160);
  if (!email) return fail(res, 400, 'missing_fields');
  const token = crypto.randomBytes(24).toString('hex');
  const r = await raw('SELECT * FROM auth_start_reset($1,$2)', [email, token]);
  const u = r.rows[0];
  if (u) {
    const url = (process.env.APP_URL || '') + '/reset/' + token;
    await M.send({
      to: u.email,
      subject: 'Passwort zurücksetzen',
      text: 'Hallo ' + u.name + ',\n\nsetzen Sie Ihr Passwort über diesen Link zurück:\n\n' +
            url + '\n\nDer Link ist eine Stunde gültig. Falls Sie das nicht angefordert haben, ' +
            'ignorieren Sie diese Nachricht.\n\nVertragsmanager'
    }).catch(() => {});
    if (!M.enabled()) console.log('[reset link] %s -> %s', email, url);
  }
  ok(res, { ok: true });
}));

// POST /api/auth/reset { token, password }
router.post('/reset', asyncH(async (req, res) => {
  const token = str(req.body.token, 100), pw = String(req.body.password || '');
  if (!token || pw.length < 8) return fail(res, 400, 'bad_request');
  const r = await raw('SELECT * FROM auth_finish_reset($1,$2)', [token, await A.hash(pw)]);
  if (!r.rowCount) return fail(res, 400, 'invalid_or_expired');
  A.issue(res, r.rows[0]);
  ok(res);
}));

// ---------------- two factor ----------------

// POST /api/auth/totp/setup — returns the secret and an otpauth URL
router.post('/totp/setup', A.requireAuth, asyncH(async (req, res) => {
  const secret = authenticator.generateSecret();
  await A.scope(req, (c) =>
    c.query('UPDATE users SET totp_secret=$1, totp_enabled=false WHERE id=$2',
      [secret, req.user.id]));
  ok(res, {
    secret,
    otpauth: authenticator.keyuri(req.user.email, 'Vertragsmanager', secret)
  });
}));

// POST /api/auth/totp/enable { code }
router.post('/totp/enable', A.requireAuth, asyncH(async (req, res) => {
  const r = await raw('SELECT * FROM auth_totp($1)', [req.user.id]);
  const sec = r.rows[0] && r.rows[0].totp_secret;
  if (!sec) return fail(res, 400, 'not_set_up');

  if (!authenticator.check(String(req.body.code || ''), sec))
    return fail(res, 400, 'bad_code');
  await A.scope(req, (c) =>
    c.query('UPDATE users SET totp_enabled=true WHERE id=$1', [req.user.id]));
  ok(res);
}));

// POST /api/auth/totp/disable
router.post('/totp/disable', A.requireAuth, asyncH(async (req, res) => {
  await A.scope(req, (c) =>
    c.query('UPDATE users SET totp_enabled=false, totp_secret=NULL WHERE id=$1', [req.user.id]));
  ok(res);
}));

module.exports = router;
