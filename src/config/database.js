const { Pool } = require("pg");
require("dotenv").config();

let connectionString = process.env.DATABASE_URL || "";

// Normalize PGSSL: default to true unless explicitly set to a false-like value
const _pgssl_env = (process.env.PGSSL || "true").toString().toLowerCase();
const pgsslFalseValues = ["false", "0", "no", "n", "off"];
const pgsslEnabled = !pgsslFalseValues.includes(_pgssl_env);

// If PGSSL explicitly false, remove any sslmode query param that may force SSL
if (!pgsslEnabled) {
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

// Enable SSL by default (for production). Allow disabling with PGSSL=false|0|no
if (pgsslEnabled) {
  poolConfig.ssl = {
    // For development with self-signed certs it's convenient to set rejectUnauthorized:false.
    // In production use a proper CA and consider setting this to true and providing sslrootcert.
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

module.exports = pool;
