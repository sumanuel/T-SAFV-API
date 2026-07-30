require("dotenv").config();
const pool = require("./src/config/database");

async function runMigration() {
  console.log("🔄 Ejecutando migración: password_reset_codes...");

  try {
    // Crear tabla password_reset_codes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        code VARCHAR(6) NOT NULL,
        reset_token VARCHAR(255) UNIQUE,
        attempts INTEGER DEFAULT 0 NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP
      )
    `);

    console.log("✅ Tabla password_reset_codes creada");

    // Crear índices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id 
      ON password_reset_codes(user_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code 
      ON password_reset_codes(code)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_codes_reset_token 
      ON password_reset_codes(reset_token)
    `);

    console.log("✅ Índices creados");
    console.log("✅ Migración completada exitosamente");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error ejecutando migración:", error.message);
    process.exit(1);
  }
}

runMigration();
