const router = require('express').Router();
const A = require('../auth');
const L = require('../letters');
const { ok, fail, asyncH, str } = require('../util');

router.use(A.requireAuth);

router.get('/kinds', (_req, res) => ok(res, L.KINDS));

/**
 * POST /api/assistant/generate
 * { customer_id, contract_id?, kind? , query? }
 * Produces a ready German letter or message from the stored data.
 */
router.post('/generate', asyncH(async (req, res) => {
  const b = req.body || {};
  const kind = L.KINDS.includes(b.kind) ? b.kind : L.match(b.query);
  if (!kind) return fail(res, 400, 'no_template');
  if (!b.customer_id) return fail(res, 400, 'customer_required');

  const out = await A.scope(req, async (c) => {
    const cu = (await c.query('SELECT * FROM customers WHERE id=$1', [b.customer_id])).rows[0];
    if (!cu) return null;
    const con = b.contract_id
      ? (await c.query('SELECT * FROM contracts WHERE id=$1', [b.contract_id])).rows[0]
      : (await c.query(
          `SELECT * FROM contracts WHERE customer_id=$1
            ORDER BY (status NOT IN ('renewed','lost')) DESC, cancel_deadline LIMIT 1`,
          [cu.id])).rows[0];
    const missing = (await c.query(
      'SELECT service FROM v_cross_sell WHERE customer_id=$1', [cu.id])).rows.map(r => r.service);
    return L.build(kind, cu, con || null, { missing });
  });

  if (!out) return fail(res, 404, 'not_found');
  ok(res, Object.assign({ kind }, out));
}));

module.exports = router;
