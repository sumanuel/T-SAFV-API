require("dotenv").config();
const pool = require("../src/config/database");
console.log("ENV DATABASE_URL=", process.env.DATABASE_URL);
console.log("ENV PGSSL=", process.env.PGSSL);
try {
  console.log("Pool config:", pool.options ? pool.options : "no options");
} catch (e) {
  console.error("Error reading pool options", e.message);
}
process.exit(0);
