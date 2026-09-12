const pool = require("../config/database");

const createNotification = async (
  usuarioId,
  { tipo = "general", titulo, cuerpo, data = {} },
  db = pool,
) => {
  const res = await db.query(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, data)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [usuarioId, tipo, titulo, cuerpo || null, data || {}],
  );
  return res.rows[0];
};

const listByUser = async (usuarioId, { limit = 30 } = {}) => {
  const res = await pool.query(
    `SELECT id, tipo, titulo, cuerpo, data, leida, created_at
     FROM notificaciones
     WHERE usuario_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [usuarioId, limit],
  );
  return res.rows;
};

const countUnread = async (usuarioId) => {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count FROM notificaciones WHERE usuario_id = $1 AND leida = FALSE`,
    [usuarioId],
  );
  return res.rows[0]?.count || 0;
};

const markAsRead = async (usuarioId, notificacionId) => {
  const res = await pool.query(
    `UPDATE notificaciones SET leida = TRUE
     WHERE id = $1 AND usuario_id = $2 RETURNING *`,
    [notificacionId, usuarioId],
  );
  return res.rows[0] || null;
};

const markAllAsRead = async (usuarioId) => {
  await pool.query(
    `UPDATE notificaciones SET leida = TRUE WHERE usuario_id = $1 AND leida = FALSE`,
    [usuarioId],
  );
};

module.exports = {
  createNotification,
  listByUser,
  countUnread,
  markAsRead,
  markAllAsRead,
};
