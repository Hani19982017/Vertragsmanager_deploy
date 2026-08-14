function ok(res, data) { res.json(data === undefined ? { ok: true } : data); }
function fail(res, code, msg) { res.status(code).json({ error: msg }); }

function asyncH(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SERVICES = ['electricity','gas','internet','mobile','kfz','health','liability','home','legal','other'];
const SUBMISSION = ['submitted','review','confirmed','rejected'];
const OUTCOMES = ['renewed','refused','postponed','no_answer'];

function str(v, max) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return max ? s.slice(0, max) : s;
}
function int(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : (def === undefined ? null : def);
}
function date(v) {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
function csvCell(v) {
  return '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"';
}

module.exports = { ok, fail, asyncH, EMAIL, SERVICES, SUBMISSION, OUTCOMES, str, int, date, csvCell };
