const router = require('express').Router();
const A = require('../auth');
const { ok, asyncH } = require('../util');

router.use(A.requireAuth);

router.get('/', asyncH(async (req, res) => {
  const out = await A.scope(req, async (c) => {
    const byService = (await c.query(
      `SELECT service_type, count(*)::int n FROM contracts GROUP BY 1 ORDER BY n DESC`)).rows;
    const byStatus = (await c.query(
      `SELECT status, count(*)::int n FROM contracts GROUP BY 1`)).rows;
    const byAgent = (await c.query(
      `SELECT u.name, count(c.*)::int n,
              count(*) FILTER (WHERE c.status='renewed')::int renewed
         FROM users u LEFT JOIN contracts c ON c.assigned_user_id=u.id
        WHERE u.tenant_id = current_setting('app.tenant_id')::uuid
        GROUP BY u.id, u.name ORDER BY n DESC`)).rows;
    const months = (await c.query(
      `SELECT to_char(date_trunc('month', cancel_deadline),'YYYY-MM') AS m, count(*)::int n
         FROM contracts
        WHERE cancel_deadline BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE + 365
          AND status NOT IN ('renewed','lost')
        GROUP BY 1 ORDER BY 1`)).rows;
    const quality = (await c.query(
      `SELECT count(*) FILTER (WHERE end_date IS NULL)::int no_end,
              count(*) FILTER (WHERE notice_period_days IS NULL)::int no_notice,
              count(*) FILTER (WHERE NOT EXISTS (
                SELECT 1 FROM documents d WHERE d.contract_id = contracts.id))::int no_doc,
              count(*) FILTER (WHERE commission_received = false
                AND submission_status='confirmed')::int unpaid
         FROM contracts`)).rows[0];
    return { byService, byStatus, byAgent, months, quality };
  });
  ok(res, out);
}));

module.exports = router;
