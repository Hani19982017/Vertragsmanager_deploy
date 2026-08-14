const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on('error', (e) => console.error('pg pool error', e.message));

/**
 * Runs fn inside a transaction with the tenant and user set as
 * PostgreSQL settings. Row level security policies read these.
 * Every query touching tenant data MUST go through here.
 */
async function withTenant(tenantId, userId, fn) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId || null]);
    await c.query("SELECT set_config('app.user_id', $1, true)", [userId || null]);
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

// For statements that legitimately sit outside tenant scope (signup, login lookup)
async function raw(sql, params) {
  const r = await pool.query(sql, params);
  return r;
}

module.exports = { pool, withTenant, raw };
