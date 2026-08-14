const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { raw, withTenant } = require('./db');

const COOKIE = 'vm_session';
const DAYS = 7;

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET missing or too short');
  return s;
}

function issue(res, user) {
  const token = jwt.sign(
    { uid: user.id, tid: user.tenant_id, role: user.role },
    secret(),
    { expiresIn: DAYS + 'd' }
  );
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DAYS * 24 * 3600 * 1000,
    path: '/'
  });
}

function clear(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

/** Attaches req.user when a valid session cookie is present. */
async function attach(req, _res, next) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return next();
  try {
    const p = jwt.verify(token, secret());
    const r = await raw('SELECT * FROM auth_load_session($1)', [p.uid]);
    const u = r.rows[0];
    if (u && u.status === 'active') req.user = u;
  } catch (_) { /* invalid or expired token */ }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

function requireOwner(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  if (req.user.role !== 'owner')
    return res.status(403).json({ error: 'owner_only' });
  next();
}

/** Convenience: run a query in the caller's tenant scope. */
function scope(req, fn) {
  return withTenant(req.user.tenant_id, req.user.id, fn);
}

const hash = (pw) => bcrypt.hash(pw, 12);
const verify = (pw, h) => bcrypt.compare(pw, h);

module.exports = { issue, clear, attach, requireAuth, requireOwner, scope, hash, verify, COOKIE };
