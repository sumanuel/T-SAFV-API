const { Pool } = require("pg");
require("dotenv").config();

let connectionString = process.env.DATABASE_URL || "";

// If PGSSL explicitly false, remove any sslmode query param that may force SSL
if (process.env.PGSSL && process.env.PGSSL.toLowerCase() === "false") {
  connectionString = connectionString.replace(
    /([?&])sslmode=[^&]+(&)?/i,
    (m, p1, p2) => (p2 ? p1 : ""),
  );
  // remove trailing ? or & if left
  connectionString = connectionString.replace(/[?&]$/, "");
}

const poolConfig = {
  connectionString,
};

// Allow disabling SSL in development via PGSSL=false (matches Auto-Guardian server .env)
if (!process.env.PGSSL || process.env.PGSSL.toLowerCase() !== "false") {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

module.exports = pool;
