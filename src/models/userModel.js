const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const createUser = async ({
  nombre,
  email,
  password,
  telefono,
  rif_cedula,
  direccion,
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const res = await pool.query(
    `INSERT INTO usuarios (nombre, email, password, telefono, rif_cedula, direccion)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nombre, email, telefono, rif_cedula, direccion`,
    [
      nombre,
      email,
      hashedPassword,
      telefono || null,
      rif_cedula || null,
      direccion || null,
    ],
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
