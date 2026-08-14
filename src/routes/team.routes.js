const router = require('express').Router();
const crypto = require('crypto');
const A = require('../auth');
const { ok, fail, asyncH, str, EMAIL } = require('../util');

router.use(A.requireAuth);

router.get('/', asyncH(async (req, res) => {
  const r = await A.scope(req, (c) => c.query(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.last_login_at,
            (SELECT count(*)::int FROM customers cu WHERE cu.assigned_user_id=u.id) AS customers
       FROM users u WHERE u.status <> 'disabled' ORDER BY u.role, u.name`));
  ok(res, r.rows);
}));

// POST /api/team/invite  (owner only)
router.post('/invite', A.requireOwner, asyncH(async (req, res) => {
  const email = str(req.body.email, 160), name = str(req.body.name, 120) || 'Mitarbeiter';
  if (!email || !EMAIL.test(email)) return fail(res, 400, 'bad_email');

  const out = await A.scope(req, async (c) => {
    const n = (await c.query("SELECT count(*)::int n FROM users WHERE status <> 'disabled'")).rows[0].n;
    if (n >= req.user.max_seats) return 'limit';
    const token = crypto.randomBytes(24).toString('hex');
    const r = await c.query(
      `INSERT INTO users (tenant_id, name, email, role, status, invite_token, invite_expires)
       VALUES (current_setting('app.tenant_id')::uuid,$1,$2,'agent','invited',$3, now() + interval '7 days')
       RETURNING id, name, email`, [name, email, token]);
    return { user: r.rows[0], invite_url: (process.env.APP_URL || '') + '/invite/' + token };
  });
  if (out === 'limit') return fail(res, 402, 'seat_limit_reached');
  ok(res, out);
}));

// POST /api/team/handover  (owner only) — move every customer of one agent to another
router.post('/handover', A.requireOwner, asyncH(async (req, res) => {
  const { from_user_id, to_user_id } = req.body || {};
  if (!from_user_id || !to_user_id) return fail(res, 400, 'missing_fields');
  const n = await A.scope(req, async (c) => {
    const a = await c.query('UPDATE customers SET assigned_user_id=$1 WHERE assigned_user_id=$2',
      [to_user_id, from_user_id]);
    await c.query('UPDATE contracts SET assigned_user_id=$1 WHERE assigned_user_id=$2',
      [to_user_id, from_user_id]);
    return a.rowCount;
  });
  ok(res, { moved: n });
}));

// POST /api/team/accept — an invited user sets their password
router.post('/accept', asyncH(async (req, res) => {
  const token = str(req.body.token, 100), pw = String(req.body.password || '');
  if (!token || pw.length < 8) return fail(res, 400, 'bad_request');
  const { raw } = require('../db');
  const r = await raw('SELECT * FROM auth_accept_invite($1,$2)', [token, await A.hash(pw)]);
  if (!r.rowCount) return fail(res, 400, 'invalid_or_expired');
  A.issue(res, r.rows[0]);
  ok(res);
}));

module.exports = router;
