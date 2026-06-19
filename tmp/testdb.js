const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const now = await pool.query('SELECT NOW()');
    console.log('DB now:', now.rows[0]);
    const users = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    console.log('Tables:', users.rows.map(r=>r.table_name).join(', '));
  } catch (err) {
    console.error('DB error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
