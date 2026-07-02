const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const createUser = async ({
  nombre,
  apellido,
  email,
  password,
  telefono,
  rif_cedula,
  direccion,
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const res = await pool.query(
    `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rif_cedula, direccion, rol)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'ADMIN')
     RETURNING id, nombre, apellido, email, telefono, rif_cedula, direccion, rol`,
    [
      nombre,
      apellido || null,
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

const updateUserRole = async (userId, rol) => {
  const res = await pool.query(
    "UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING id, nombre, email, rol",
    [rol, userId],
  );
  return res.rows[0];
};

const updatePushToken = async (userId, pushToken) => {
  await pool.query("UPDATE usuarios SET push_token = $1 WHERE id = $2", [
    pushToken,
    userId,
  ]);
};

const findPushTokenByUserId = async (userId) => {
  const res = await pool.query(
    "SELECT push_token FROM usuarios WHERE id = $1",
    [userId],
  );
  return res.rows[0]?.push_token || null;
};

module.exports = {
  createUser,
  findUserByEmail,
  updateUserRole,
  updatePushToken,
  findPushTokenByUserId,
};
