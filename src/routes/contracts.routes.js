const router = require('express').Router();
const A = require('../auth');
const { ok, fail, asyncH, str, int, date, SERVICES, SUBMISSION, OUTCOMES } = require('../util');

router.use(A.requireAuth);

const mine = (req) =>
  (req.user.role !== 'owner' && req.user.restrict_agents)
    ? ' AND c.assigned_user_id = current_setting(\'app.user_id\')::uuid ' : '';

// GET /api/contracts/due — the priority list
router.get('/due', asyncH(async (req, res) => {
  const rows = await A.scope(req, (c) => c.query(
    `SELECT c.*, (c.cancel_deadline - CURRENT_DATE) AS days_remaining,
            cu.first_name, cu.last_name, cu.phone, cu.whatsapp, cu.email
       FROM contracts c JOIN customers cu ON cu.id = c.customer_id
      WHERE c.status NOT IN ('renewed','lost','cancelled_early')
        AND c.reminder_muted = false
        AND (c.cancel_deadline - CURRENT_DATE) <= c.reminder_lead_days
        ${mine(req)}
      ORDER BY c.cancel_deadline LIMIT 200`));
  ok(res, rows.rows);
}));

// GET /api/contracts/followups — due today or overdue
router.get('/followups', asyncH(async (req, res) => {
  const rows = await A.scope(req, (c) => c.query(
    `SELECT c.*, (c.cancel_deadline - CURRENT_DATE) AS days_remaining,
            cu.first_name, cu.last_name, cu.phone, cu.whatsapp, cu.email
       FROM contracts c JOIN customers cu ON cu.id = c.customer_id
      WHERE c.follow_up_date IS NOT NULL AND c.follow_up_date <= CURRENT_DATE
        ${mine(req)}
      ORDER BY c.follow_up_date LIMIT 200`));
  ok(res, rows.rows);
}));

// GET /api/contracts/unconfirmed — provider has not confirmed
router.get('/unconfirmed', asyncH(async (req, res) => {
  const rows = await A.scope(req, (c) => c.query(
    `SELECT c.*, (CURRENT_DATE - c.submitted_at) AS days_waiting,
            cu.first_name, cu.last_name
       FROM contracts c JOIN customers cu ON cu.id = c.customer_id
      WHERE c.submission_status IN ('submitted','review','rejected') ${mine(req)}
      ORDER BY c.submitted_at NULLS LAST LIMIT 200`));
  ok(res, rows.rows);
}));

// GET /api/contracts/withdrawal — inside the 14 day window
router.get('/withdrawal', asyncH(async (req, res) => {
  const rows = await A.scope(req, (c) => c.query(
    `SELECT c.*, 14 - (CURRENT_DATE - c.signed_date) AS days_left,
            cu.first_name, cu.last_name
       FROM contracts c JOIN customers cu ON cu.id = c.customer_id
      WHERE c.signed_date IS NOT NULL AND (CURRENT_DATE - c.signed_date) < 14 ${mine(req)}
      ORDER BY c.signed_date DESC`));
  ok(res, rows.rows);
}));

// GET /api/contracts/by-provider/:name — price increase tool
router.get('/by-provider/:name', asyncH(async (req, res) => {
  const rows = await A.scope(req, (c) => c.query(
    `SELECT c.*, cu.first_name, cu.last_name, cu.phone, cu.whatsapp, cu.email
       FROM contracts c JOIN customers cu ON cu.id = c.customer_id
      WHERE lower(coalesce(c.provider_name,'')) = lower($1)
        AND c.status NOT IN ('renewed','lost') ${mine(req)}
      ORDER BY cu.last_name`, [req.params.name]));
  ok(res, rows.rows);
}));

// GET /api/contracts/providers — distinct providers in use
router.get('/providers', asyncH(async (req, res) => {
  const rows = await A.scope(req, (c) => c.query(
    `SELECT provider_name AS name, count(*)::int AS n FROM contracts
      WHERE provider_name IS NOT NULL AND status <> 'lost'
      GROUP BY provider_name ORDER BY n DESC`));
  ok(res, rows.rows);
}));

// POST /api/contracts — archive a signed contract
router.post('/', asyncH(async (req, res) => {
  const b = req.body || {};
  const end = date(b.end_date);
  const service = SERVICES.includes(b.service_type) ? b.service_type : null;
  if (!b.customer_id) return fail(res, 400, 'customer_required');
  if (!end) return fail(res, 400, 'end_date_required');
  if (!service) return fail(res, 400, 'service_required');

  const row = await A.scope(req, async (c) => {
    const r = await c.query(
      `INSERT INTO contracts
        (tenant_id, customer_id, service_type, provider_name, contract_number, tariff_name,
         signed_date, start_date, duration_months, end_date, notice_period_days,
         reminder_lead_days, submission_status, submitted_at, consumption_kwh,
         assigned_user_id, source_document_id, created_by)
       VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
               CURRENT_DATE,$13,$14,$15,$16)
       RETURNING *`,
      [b.customer_id, service, str(b.provider_name,120), str(b.contract_number,60),
       str(b.tariff_name,120), date(b.signed_date), date(b.start_date), int(b.duration_months),
       end, int(b.notice_period_days, 42), int(b.reminder_lead_days, req.user.default_lead_days),
       SUBMISSION.includes(b.submission_status) ? b.submission_status : 'submitted',
       int(b.consumption_kwh), b.assigned_user_id || req.user.id,
       b.source_document_id || null, req.user.id]);
    if (b.source_document_id) {
      await c.query('UPDATE documents SET contract_id=$1, customer_id=coalesce(customer_id,$3) WHERE id=$2',
        [r.rows[0].id, b.source_document_id, b.customer_id]);
    }
    if (b.inbox_message_id) {
      await c.query(
        "UPDATE inbox_messages SET state='archived', customer_id=$2 WHERE id=$1",
        [b.inbox_message_id, b.customer_id]);
    }
    return r.rows[0];
  });
  ok(res, row);
}));

// PATCH /api/contracts/:id
router.patch('/:id', asyncH(async (req, res) => {
  const b = req.body || {};
  const allowed = {
    provider_name: str, contract_number: str, tariff_name: str,
    signed_date: date, start_date: date, end_date: date,
    notice_period_days: int, reminder_lead_days: int, duration_months: int,
    consumption_kwh: int, follow_up_date: date, follow_up_note: str,
    rejection_reason: str, assigned_user_id: (v) => v || null
  };
  const sets = [], params = [];
  for (const k in allowed) {
    if (b[k] === undefined) continue;
    params.push(allowed[k](b[k]));
    sets.push(`${k} = $${params.length}`);
  }
  if (b.submission_status && SUBMISSION.includes(b.submission_status)) {
    params.push(b.submission_status); sets.push(`submission_status = $${params.length}`);
    if (b.submission_status === 'confirmed') sets.push(`rejection_reason = NULL`);
  }
  if (b.commission_received !== undefined) {
    params.push(!!b.commission_received); sets.push(`commission_received = $${params.length}`);
  }
  if (b.reminder_muted !== undefined) {
    params.push(!!b.reminder_muted); sets.push(`reminder_muted = $${params.length}`);
  }
  if (!sets.length) return fail(res, 400, 'nothing_to_update');
  params.push(req.params.id);
  const r = await A.scope(req, (c) =>
    c.query(`UPDATE contracts SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`, params));
  if (!r.rowCount) return fail(res, 404, 'not_found');
  ok(res, r.rows[0]);
}));

/**
 * POST /api/contracts/:id/outcome
 * The heart of the renewal loop.
 *  renewed  -> closes this contract, opens the successor
 *  refused  -> marks lost AND records the competitor contract so the
 *              customer returns to the queue for the next cycle
 *  postponed / no_answer -> sets a follow-up date
 */
router.post('/:id/outcome', asyncH(async (req, res) => {
  const b = req.body || {};
  if (!OUTCOMES.includes(b.outcome)) return fail(res, 400, 'bad_outcome');
  const channel = ['whatsapp','email','phone','letter'].includes(b.channel) ? b.channel : 'phone';

  const out = await A.scope(req, async (c) => {
    const cur = (await c.query('SELECT * FROM contracts WHERE id=$1', [req.params.id])).rows[0];
    if (!cur) return null;

    await c.query(
      `INSERT INTO activities (tenant_id, customer_id, contract_id, user_id, channel, outcome, note)
       VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,$4,$5,$6)`,
      [cur.customer_id, cur.id, req.user.id, channel, b.outcome, str(b.note, 2000)]);

    if (b.outcome === 'renewed') {
      const months = int(b.duration_months, 24);
      await c.query(`UPDATE contracts SET status='renewed', follow_up_date=NULL WHERE id=$1`, [cur.id]);
      const nw = await c.query(
        `INSERT INTO contracts
          (tenant_id, customer_id, service_type, provider_name, signed_date, start_date,
           duration_months, end_date, notice_period_days, reminder_lead_days,
           submission_status, submitted_at, previous_contract_id, assigned_user_id, created_by)
         VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,CURRENT_DATE,$4,$5,
                 ($4::date + make_interval(months => $5::int))::date,$6,$7,'submitted',CURRENT_DATE,$8,$9,$10)
         RETURNING *`,
        [cur.customer_id, cur.service_type, str(b.provider_name, 120) || cur.provider_name,
         cur.end_date, months, cur.notice_period_days, cur.reminder_lead_days,
         cur.id, cur.assigned_user_id, req.user.id]);
      return { status: 'renewed', successor: nw.rows[0] };
    }

    if (b.outcome === 'refused') {
      const months = int(b.duration_months, 24);
      const prov = str(b.new_provider, 120);
      await c.query(`UPDATE contracts SET status='lost', follow_up_date=NULL WHERE id=$1`, [cur.id]);
      let follow = null;
      if (prov) {
        follow = (await c.query(
          `INSERT INTO contracts
            (tenant_id, customer_id, service_type, provider_name, start_date, duration_months,
             end_date, notice_period_days, reminder_lead_days, submission_status,
             previous_contract_id, assigned_user_id, created_by)
           VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,$4,$5,
                   ($4::date + make_interval(months => $5::int))::date,$6,$7,'confirmed',$8,$9,$10)
           RETURNING *`,
          [cur.customer_id, cur.service_type, prov, cur.end_date, months,
           cur.notice_period_days, cur.reminder_lead_days, cur.id,
           cur.assigned_user_id, req.user.id])).rows[0];
      }
      return { status: 'lost', competitor_contract: follow };
    }

    const fup = date(b.follow_up_date) ||
      (b.outcome === 'no_answer'
        ? new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
        : null);
    await c.query(
      `UPDATE contracts SET status='contacted', follow_up_date=$1, follow_up_note=$2 WHERE id=$3`,
      [fup, str(b.note, 500), cur.id]);
    return { status: 'contacted', follow_up_date: fup };
  });

  if (!out) return fail(res, 404, 'not_found');
  ok(res, out);
}));

// POST /api/contracts/:id/followup
router.post('/:id/followup', asyncH(async (req, res) => {
  const d = req.body.clear ? null : date(req.body.follow_up_date);
  if (!req.body.clear && !d) return fail(res, 400, 'date_required');
  const r = await A.scope(req, (c) => c.query(
    `UPDATE contracts SET follow_up_date=$1, follow_up_note=$2 WHERE id=$3 RETURNING *`,
    [d, req.body.clear ? null : str(req.body.follow_up_note, 500), req.params.id]));
  if (!r.rowCount) return fail(res, 404, 'not_found');
  ok(res, r.rows[0]);
}));

module.exports = router;
