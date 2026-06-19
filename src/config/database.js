const { Pool } = require("pg");
const fs = require("fs");
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
  // If a root CA path is provided via PG_SSL_ROOT_CERT or via PG_CONNECTION_OPTIONS (sslrootcert),
  // read it and use strict verification.
  let rootCertPath = process.env.PG_SSL_ROOT_CERT;
  if (!rootCertPath && process.env.PG_CONNECTION_OPTIONS) {
    try {
      // PG_CONNECTION_OPTIONS may be in the form 'sslrootcert=/path/ca.pem&other=val' or prefixed with '?'
      const opts = process.env.PG_CONNECTION_OPTIONS.replace(/^\?/, "");
      const qp = new URLSearchParams(opts);
      if (qp.has("sslrootcert")) rootCertPath = qp.get("sslrootcert");
    } catch (e) {
      // ignore parsing errors and proceed
    }
  }

  if (rootCertPath && fs.existsSync(rootCertPath)) {
    try {
      const ca = fs.readFileSync(rootCertPath).toString();
      poolConfig.ssl = { ca, rejectUnauthorized: true };
    } catch (e) {
      // Fallback to permissive SSL if reading fails
      console.error("Failed to read PG_SSL_ROOT_CERT:", e.message);
      poolConfig.ssl = { rejectUnauthorized: false };
    }
  } else {
    // No CA provided: keep permissive behavior for development convenience.
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

const pool = new Pool(poolConfig);

module.exports = pool;
