const nodemailer = require('nodemailer');

let tx = null;
function transport() {
  if (tx !== null) return tx;
  if (!process.env.SMTP_HOST) { tx = false; return tx; }
  tx = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: String(process.env.SMTP_PORT || '465') === '465',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined
  });
  return tx;
}

/**
 * Sends an e-mail. When SMTP is not configured the message is logged
 * instead of thrown, so the application keeps working in a fresh install.
 * Returns true when it actually left the building.
 */
async function send({ to, subject, text, html, from }) {
  const t = transport();
  if (!t) {
    console.log('[mail disabled] to=%s subject=%s', to, subject);
    return false;
  }
  await t.sendMail({
    from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
    to, subject, text,
    html: html || ('<pre style="font:14px/1.7 Arial;white-space:pre-wrap">' +
      String(text || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])) + '</pre>')
  });
  return true;
}

const enabled = () => !!process.env.SMTP_HOST;

module.exports = { send, enabled };
