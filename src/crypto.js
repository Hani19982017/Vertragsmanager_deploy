const crypto = require('crypto');
function key() {
  const k = process.env.STORAGE_KEY || process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(k).digest();
}
function seal(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const out = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), out]);
}
function open_(buf) {
  const b = Buffer.from(buf);
  const iv = b.subarray(0, 12), tag = b.subarray(12, 28), body = b.subarray(28);
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(body), d.final()]).toString('utf8');
}
module.exports = { seal, open: open_ };
