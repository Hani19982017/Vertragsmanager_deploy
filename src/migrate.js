require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const c = await pool.connect();
  try {
    const done = await c.query(
      "SELECT to_regclass('public.tenants') IS NOT NULL AS ok"
    );
    if (done.rows[0].ok) {
      console.log('migrate: schema already present, skipping');
      return;
    }
    const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await c.query(sql);
    console.log('migrate: schema created');
  } catch (e) {
    console.error('migrate failed:', e.message);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
})();
