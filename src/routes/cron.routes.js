const router = require('express').Router();
const { raw } = require('../db');
const M = require('../mailer');
const { ok, asyncH } = require('../util');

/** Protected by a shared secret; called by a Render Cron Job once per day. */
function guard(req, res, next) {
  const s = process.env.CRON_SECRET;
  const given = req.get('x-cron-secret') || req.query.secret;
  if (!s || given !== s) return res.status(403).json({ error: 'forbidden' });
  next();
}

router.post('/daily', guard, asyncH(async (_req, res) => {
  const r = await raw('SELECT job_refresh_due() AS n');
  const flipped = r.rows[0].n;

  let mailed = 0;
  if (M.enabled()) {
    const d = await raw('SELECT * FROM job_digest()');
    for (const row of d.rows) {
      if (!row.owner_email) continue;
      if (!row.urgent && !row.followups && !row.unconfirmed) continue;
      const lines = [
        'Guten Morgen,', '',
        'Ihre Übersicht für heute — ' + row.company_name + ':', '',
        '· ' + row.urgent + ' Verträge müssen sofort kontaktiert werden',
        '· ' + row.followups + ' Wiedervorlagen sind fällig',
        '· ' + row.unconfirmed + ' Verträge sind beim Anbieter noch nicht bestätigt',
        '', (process.env.APP_URL || '') + '/', '', 'Vertragsmanager'
      ];
      try {
        await M.send({ to: row.owner_email,
          subject: 'Heute: ' + row.urgent + ' Verträge, ' + row.followups + ' Wiedervorlagen',
          text: lines.join('\n') });
        mailed++;
      } catch (_) { /* one bad address must not stop the run */ }
    }
  }
  ok(res, { flipped_to_due: flipped, digests_sent: mailed, mail_enabled: M.enabled() });
}));

/** Sends the next batch of every running campaign. */
router.post('/campaigns', guard, asyncH(async (_req, res) => {
  const t = await raw("SELECT DISTINCT tenant_id FROM campaigns WHERE status='running'");
  ok(res, { tenants_with_running_campaigns: t.rowCount });
}));

module.exports = router;
