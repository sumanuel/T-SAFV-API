const pool = require("../config/database");
const crypto = require("crypto");

const createInvitacion = async (
  asociacion_id,
  email_invitado,
  rol_invitado,
  creada_por,
  diasValidez = 7,
) => {
  const token = crypto.randomBytes(24).toString("hex");
  const expira_en = new Date(Date.now() + diasValidez * 24 * 60 * 60 * 1000);
  const res = await pool.query(
    `INSERT INTO invitaciones (asociacion_id, email_invitado, rol_invitado, token_invitacion, estado, creada_por, expira_en)
     VALUES ($1, $2, $3, $4, 'PENDIENTE', $5, $6) RETURNING *`,
    [asociacion_id, email_invitado, rol_invitado, token, creada_por, expira_en],
  );
  return res.rows[0];
};

const findPendingByEmail = async (email) => {
  const res = await pool.query(
    "SELECT * FROM invitaciones WHERE email_invitado = $1 AND estado = $2",
    [email, "PENDIENTE"],
  );
  return res.rows;
};

const findByToken = async (token) => {
  const res = await pool.query(
    "SELECT * FROM invitaciones WHERE token_invitacion = $1 LIMIT 1",
    [token],
  );
  return res.rows[0];
};

const acceptInvitation = async (token, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invRes = await client.query(
      "SELECT * FROM invitaciones WHERE token_invitacion = $1 FOR UPDATE",
      [token],
    );
    const invitacion = invRes.rows[0];
    if (!invitacion) throw new Error("Invitation not found");
    if (invitacion.estado !== "PENDIENTE")
      throw new Error("Invitation not pending");
    if (invitacion.expira_en && new Date(invitacion.expira_en) < new Date())
      throw new Error("Invitation expired");

    await client.query(
      "UPDATE invitaciones SET estado = $1, aceptada_en = NOW() WHERE id = $2",
      ["ACEPTADA", invitacion.id],
    );

    const membresiaRes = await client.query(
      "INSERT INTO membresias (usuario_id, asociacion_id, rol) VALUES ($1, $2, $3) RETURNING id",
      [userId, invitacion.asociacion_id, invitacion.rol_invitado],
    );
    const membresia = membresiaRes.rows[0];

    await client.query(
      "INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id) VALUES ($1, $2, $3, $4, $5)",
      [membresia.id, "MEMBRESIA", "ACTIVO", "Aceptación de invitación", userId],
    );

    await client.query("COMMIT");
    return { invitacion, membresia };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createInvitacion,
  findPendingByEmail,
  findByToken,
  acceptInvitation,
};
