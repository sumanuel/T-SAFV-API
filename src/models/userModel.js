const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const createUser = async (nombre, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const res = await pool.query(
    "INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING id, nombre, email",
    [nombre, email, hashedPassword],
  );
  return res.rows[0];
};

const findUserByEmail = async (email) => {
  const res = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
    email,
  ]);
  return res.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
};
