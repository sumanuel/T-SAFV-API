const fs = require("fs");
const path = require("path");
const pool = require("../src/config/database");

const migrationsDir = path.join(__dirname, "..", "migrations");

(async () => {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS migrations (name text primary key, applied_at timestamptz default now())`,
    );
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const name = file;
      const res = await pool.query(
        "SELECT 1 FROM migrations WHERE name=$1 LIMIT 1",
        [name],
      );
      if (res.rowCount > 0) {
        console.log("Skipping", name);
        continue;
      }
      console.log("Applying", name);
      const sql = fs.readFileSync(path.join(migrationsDir, file)).toString();
      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query("INSERT INTO migrations (name) VALUES ($1)", [name]);
        await pool.query("COMMIT");
        console.log("Applied", name);
      } catch (e) {
        await pool.query("ROLLBACK");
        throw e;
      }
    }
    console.log("Migrations complete");
  } catch (e) {
    console.error("Migration error", e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
