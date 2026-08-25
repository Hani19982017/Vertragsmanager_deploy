const router = require('express').Router();
const A = require('../auth');
const { raw } = require('../db');
const { ok, asyncH, csvCell } = require('../util');

router.use(A.requireAuth);

// GET /api/stats — dashboard metric cards
router.get('/stats', asyncH(async (req, res) => {
  const s = await A.scope(req, async (c) => {
    const q = (sql) => c.query(sql).then(r => r.rows[0].n);
    return {
      urgent: await q(`SELECT count(*)::int n FROM contracts
        WHERE status NOT IN ('renewed','lost','cancelled_early') AND reminder_muted=false
          AND (cancel_deadline - CURRENT_DATE) <= 14`),
      in60: await q(`SELECT count(*)::int n FROM contracts
        WHERE status NOT IN ('renewed','lost','cancelled_early') AND reminder_muted=false
          AND (cancel_deadline - CURRENT_DATE) <= 60`),
      followups: await q(`SELECT count(*)::int n FROM contracts
        WHERE follow_up_date IS NOT NULL AND follow_up_date <= CURRENT_DATE`),
      unconfirmed: await q(`SELECT count(*)::int n FROM contracts
        WHERE submission_status IN ('submitted','review','rejected')`),
      customers: await q(`SELECT count(*)::int n FROM customers WHERE is_active`),
      renewed: await q(`SELECT count(*)::int n FROM contracts WHERE status='renewed'`),
      lost: await q(`SELECT count(*)::int n FROM contracts WHERE status='lost'`)
    };
  });
  s.renewal_rate = (s.renewed + s.lost) ? Math.round(s.renewed / (s.renewed + s.lost) * 100) : 0;
  ok(res, s);
}));

// GET /api/export.csv — owner only, every access is logged
router.get('/export.csv', A.requireOwner, asyncH(async (req, res) => {
  const rows = await A.scope(req, async (c) => {
    const r = await c.query(
      `SELECT cu.first_name, cu.last_name, cu.phone, cu.whatsapp, cu.email,
              cu.street, cu.postal_code, cu.city,
              c.service_type, c.provider_name, c.contract_number,
              c.start_date, c.end_date, c.notice_period_days, c.cancel_deadline,
              c.status, c.submission_status
         FROM contracts c JOIN customers cu ON cu.id=c.customer_id
        ORDER BY cu.last_name, c.cancel_deadline`);
    await c.query(
      `INSERT INTO access_log (tenant_id, user_id, action, row_count, ip_address)
       VALUES (current_setting('app.tenant_id')::uuid,$1,'export',$2,$3)`,
      [req.user.id, r.rowCount, req.ip]);
    return r.rows;
  });
  const head = ['Vorname','Nachname','Telefon','WhatsApp','E-Mail','Strasse','PLZ','Ort',
    'Dienstleistung','Anbieter','Vertragsnummer','Beginn','Ende','Kuendigungsfrist',
    'Kuendigungstermin','Status','Anbieterstatus'];
  const body = rows.map(r => Object.values(r).map(csvCell).join(';'));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kunden.csv"');
  res.send('﻿' + [head.map(csvCell).join(';'), ...body].join('\n'));
}));

// GET /api/access-log — owner only
router.get('/access-log', A.requireOwner, asyncH(async (req, res) => {
  const r = await A.scope(req, (c) => c.query(
    `SELECT a.*, u.name AS user_name FROM access_log a
       LEFT JOIN users u ON u.id=a.user_id
      ORDER BY a.created_at DESC LIMIT 50`));
  ok(res, r.rows);
}));

// GET /api/duplicates — owner only
router.get('/duplicates', A.requireOwner, asyncH(async (req, res) => {
  const r = await A.scope(req, (c) => c.query(
    `SELECT a.id a_id, a.first_name a_fn, a.last_name a_ln, a.phone a_phone,
            b.id b_id, b.first_name b_fn, b.last_name b_ln, b.phone b_phone,
            CASE WHEN a.phone = b.phone THEN 'phone' ELSE 'name' END AS reason
       FROM customers a JOIN customers b
         ON a.id < b.id AND a.is_active AND b.is_active
        AND ((a.phone IS NOT NULL AND a.phone = b.phone)
          OR (lower(a.first_name)=lower(b.first_name) AND lower(a.last_name)=lower(b.last_name)))
      LIMIT 50`));
  ok(res, r.rows);
}));

// GET /api/dbsize — owner-only: current database size (just for info)
router.get('/dbsize', A.requireOwner, asyncH(async (req, res) => {
  const r = await raw(
    `SELECT pg_database_size(current_database()) AS bytes,
            pg_size_pretty(pg_database_size(current_database())) AS pretty`);
  ok(res, { bytes: Number(r.rows[0].bytes), pretty: r.rows[0].pretty });
}));

// GET /api/storage — total storage this tenant uses: text rows + uploaded files
router.get('/storage', asyncH(async (req, res) => {
  const out = await A.scope(req, async (c) => {
    // uploaded file bytes across all of this tenant's documents
    const files = (await c.query(
      `SELECT COALESCE(SUM(size_bytes),0)::bigint AS b FROM documents`)).rows[0].b;
    // actual DB row sizes for this tenant's data
    const text = (await c.query(
      `SELECT
         (SELECT COALESCE(SUM(pg_column_size(cu.*)),0) FROM customers cu) +
         (SELECT COALESCE(SUM(pg_column_size(ct.*)),0) FROM contracts ct) +
         (SELECT COALESCE(SUM(pg_column_size(a.*)),0)  FROM activities a) +
         (SELECT COALESCE(SUM(pg_column_size(d.*)),0)  FROM documents d) AS b`)).rows[0].b;
    const custCount = (await c.query(
      `SELECT count(*)::int n FROM customers WHERE is_active`)).rows[0].n;
    return {
      files: Number(files),
      text: Number(text),
      total: Number(files) + Number(text),
      customers: custCount
    };
  });
  ok(res, out);
}));

// POST /api/feedback { message } — sends a note to the platform team
router.post('/feedback', asyncH(async (req, res) => {
  const msg = String((req.body && req.body.message) || '').trim().slice(0, 5000);
  if (!msg) return fail(res, 400, 'empty');
  const to = process.env.FEEDBACK_EMAIL;
  if (!to) return fail(res, 501, 'feedback_not_configured');
  const M = require('../mailer');
  const sent = await M.send({
    to,
    subject: 'Feedback / Vorschlag von ' + (req.user.email || 'Nutzer'),
    text: 'Von: ' + (req.user.name || '') + ' <' + (req.user.email || '') + '>\n' +
          'Firma-ID: ' + (req.user.tenant_id || '') + '\n\n' + msg
  });
  if (!sent) return fail(res, 501, 'feedback_not_configured');
  ok(res);
}));

module.exports = router;
