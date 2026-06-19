const pool = require("../config/database");

const createHistoryEntry = async (
  entidad_id,
  entidad_tipo,
  estado,
  motivo,
  cambiado_por_usuario_id,
) => {
  const res = await pool.query(
    "INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id],
  );
  return res.rows[0];
};

module.exports = {
  createHistoryEntry,
};
