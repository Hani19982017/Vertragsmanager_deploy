const router = require('express').Router();
const A = require('../auth');
const M = require('../mailer');
const { ok, fail, asyncH, str, int, SERVICES } = require('../util');

router.use(A.requireAuth);

const WA_DAILY_CAP = 250;   // new contacts per 24h on a fresh WhatsApp number
const EMAIL_DAILY_CAP = 2000;

/** Resolves a segment definition into eligible customers. */
async function resolveSegment(c, seg, category, channel) {
  let rows;
  if (seg.type === 'missing_service') {
    rows = (await c.query(
      `SELECT cu.* FROM customers cu
        WHERE cu.is_active AND EXISTS (
          SELECT 1 FROM v_cross_sell x WHERE x.customer_id = cu.id AND x.service = $1)`,
      [seg.service])).rows;
  } else if (seg.type === 'provider') {
    rows = (await c.query(
      `SELECT DISTINCT cu.* FROM customers cu JOIN contracts ct ON ct.customer_id = cu.id
        WHERE cu.is_active AND lower(coalesce(ct.provider_name,'')) = lower($1)
          AND ct.status NOT IN ('renewed','lost')`, [seg.provider])).rows;
  } else {
    rows = (await c.query(
      `SELECT DISTINCT cu.* FROM customers cu JOIN contracts ct ON ct.customer_id = cu.id
        WHERE cu.is_active AND ct.status NOT IN ('renewed','lost')
          AND (ct.cancel_deadline - CURRENT_DATE) <= 90`)).rows;
  }
  const reachable = rows.filter(u => channel === 'email' ? !!u.email : !!(u.whatsapp || u.phone));
  const eligible = category === 'marketing'
    ? reachable.filter(u => u.marketing_consent)
    : reachable;
  return { reachable, eligible, excluded: reachable.length - eligible.length };
}

// POST /api/campaigns/preview
router.post('/preview', asyncH(async (req, res) => {
  const b = req.body || {};
  const channel = b.channel === 'email' ? 'email' : 'whatsapp';
  const category = b.category === 'marketing' ? 'marketing' : 'utility';
  const cap = channel === 'whatsapp' ? WA_DAILY_CAP : EMAIL_DAILY_CAP;
  const limit = Math.min(int(b.daily_limit, 50) || 50, cap);

  const out = await A.scope(req, async (c) => {
    const r = await resolveSegment(c, b.segment || {}, category, channel);
    return {
      total: r.eligible.length,
      excluded: r.excluded,
      daily_limit: limit,
      daily_cap: cap,
      days: r.eligible.length ? Math.ceil(r.eligible.length / limit) : 0,
      sample: r.eligible.slice(0, 8).map(u => ({
        id: u.id, name: u.first_name + ' ' + u.last_name,
        target: channel === 'email' ? u.email : (u.whatsapp || u.phone)
      }))
    };
  });
  ok(res, out);
}));

// POST /api/campaigns — create and enqueue
router.post('/', asyncH(async (req, res) => {
  const b = req.body || {};
  const channel = b.channel === 'email' ? 'email' : 'whatsapp';
  const category = b.category === 'marketing' ? 'marketing' : 'utility';
  const body = str(b.message_body, 4000);
  if (!body) return fail(res, 400, 'message_required');
  const OPT_OUT = 'Antworten Sie STOP, um keine weiteren Nachrichten zu erhalten.';
  const finalBody = body.indexOf('STOP') >= 0 ? body : body + '\n\n' + OPT_OUT;
  const cap = channel === 'whatsapp' ? WA_DAILY_CAP : EMAIL_DAILY_CAP;
  const limit = Math.min(int(b.daily_limit, 50) || 50, cap);

  const out = await A.scope(req, async (c) => {
    const seg = b.segment || {};
    const r = await resolveSegment(c, seg, category, channel);
    if (!r.eligible.length) return 'empty';
    const camp = (await c.query(
      `INSERT INTO campaigns (tenant_id, name, channel, category, message_body,
                              segment_filter, daily_limit, status, total_count, created_by)
       VALUES (current_setting('app.tenant_id')::uuid,$1,$2,$3,$4,$5,$6,'running',$7,$8)
       RETURNING *`,
      [str(b.name, 120) || 'Kampagne', channel, category, finalBody,
       JSON.stringify(seg), limit, r.eligible.length, req.user.id])).rows[0];
    for (const u of r.eligible) {
      await c.query(
        `INSERT INTO campaign_recipients (tenant_id, campaign_id, customer_id)
         VALUES (current_setting('app.tenant_id')::uuid,$1,$2)
         ON CONFLICT DO NOTHING`, [camp.id, u.id]);
    }
    return camp;
  });
  if (out === 'empty') return fail(res, 400, 'no_recipients');
  ok(res, out);
}));

// GET /api/campaigns
router.get('/', asyncH(async (req, res) => {
  const r = await A.scope(req, (c) => c.query(
    `SELECT c.*, (SELECT count(*)::int FROM campaign_recipients r
                   WHERE r.campaign_id=c.id AND r.status='pending') AS pending
       FROM campaigns c ORDER BY c.created_at DESC LIMIT 50`));
  ok(res, r.rows);
}));

// GET /api/campaigns/:id/recipients
router.get('/:id/recipients', asyncH(async (req, res) => {
  const r = await A.scope(req, (c) => c.query(
    `SELECT r.*, cu.first_name, cu.last_name, cu.email, cu.whatsapp, cu.phone
       FROM campaign_recipients r JOIN customers cu ON cu.id=r.customer_id
      WHERE r.campaign_id=$1 ORDER BY r.status, cu.last_name LIMIT 500`, [req.params.id]));
  ok(res, r.rows);
}));

/**
 * POST /api/campaigns/:id/run
 * Sends the next daily batch. E-mail goes out through SMTP.
 * WhatsApp is marked ready for manual sending until a provider is connected —
 * the deliberate decision is never to automate an unofficial channel.
 * Stops automatically when the failure rate passes 5 percent.
 */
router.post('/:id/run', asyncH(async (req, res) => {
  const out = await A.scope(req, async (c) => {
    const camp = (await c.query('SELECT * FROM campaigns WHERE id=$1', [req.params.id])).rows[0];
    if (!camp) return null;
    if (camp.status !== 'running') return { skipped: camp.status };

    const batch = (await c.query(
      `SELECT r.id, r.customer_id, cu.first_name, cu.last_name, cu.email, cu.whatsapp, cu.phone
         FROM campaign_recipients r JOIN customers cu ON cu.id=r.customer_id
        WHERE r.campaign_id=$1 AND r.status='pending'
        ORDER BY cu.last_name LIMIT $2`, [camp.id, camp.daily_limit])).rows;

    let sent = 0, failed = 0;
    for (const r of batch) {
      const personal = camp.message_body.replace(/\{name\}/gi, r.first_name || '');
      let okSend = false, err = null;
      if (camp.channel === 'email') {
        try { okSend = await require('../mailer').send({
          to: r.email, subject: camp.name, text: personal }); }
        catch (e) { err = e.message; }
      } else {
        okSend = true; // queued for the operator, see note above
      }
      if (okSend) { sent++;
        await c.query("UPDATE campaign_recipients SET status='sent', sent_at=now() WHERE id=$1", [r.id]);
      } else { failed++;
        await c.query("UPDATE campaign_recipients SET status='failed', error_reason=$2 WHERE id=$1",
          [r.id, err || 'not_sent']);
      }
    }
    const left = (await c.query(
      "SELECT count(*)::int n FROM campaign_recipients WHERE campaign_id=$1 AND status='pending'",
      [camp.id])).rows[0].n;
    const totalFailed = (await c.query(
      "SELECT count(*)::int n FROM campaign_recipients WHERE campaign_id=$1 AND status IN ('failed','opted_out')",
      [camp.id])).rows[0].n;
    const rate = camp.total_count ? totalFailed / camp.total_count : 0;
    const status = rate > 0.05 ? 'paused' : (left ? 'running' : 'completed');
    await c.query(
      `UPDATE campaigns SET sent_count = sent_count + $2, blocked_count = $3, status = $4
        WHERE id = $1`, [camp.id, sent, totalFailed, status]);
    return { sent, failed, remaining: left, status, auto_paused: rate > 0.05 };
  });
  if (!out) return fail(res, 404, 'not_found');
  ok(res, out);
}));

router.post('/:id/pause', asyncH(async (req, res) => {
  await A.scope(req, (c) => c.query(
    "UPDATE campaigns SET status='paused' WHERE id=$1 AND status='running'", [req.params.id]));
  ok(res);
}));

module.exports = router;
