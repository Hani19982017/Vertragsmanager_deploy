/** Called by the Render Cron Job. Hits the protected daily endpoint. */
const url = (process.env.APP_URL || '').replace(/\/$/, '') + '/api/cron/daily';
if (!process.env.APP_URL || !process.env.CRON_SECRET) {
  console.error('APP_URL and CRON_SECRET must be set');
  process.exit(1);
}
fetch(url, { method: 'POST', headers: { 'x-cron-secret': process.env.CRON_SECRET } })
  .then(r => r.text().then(t => { console.log(r.status, t); process.exit(r.ok ? 0 : 1); }))
  .catch(e => { console.error(e.message); process.exit(1); });
