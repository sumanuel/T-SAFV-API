const pool = require("../config/database");

const getMiembrosByAsociacion = async (asociacion_id) => {
  const res = await pool.query(
    `SELECT u.id, u.nombre, u.email, m.rol FROM usuarios u
     JOIN membresias m ON m.usuario_id = u.id
     WHERE m.asociacion_id = $1`,
    [asociacion_id],
  );
  return res.rows;
};

const getUnidadesByAsociacion = async (asociacion_id) => {
  const res = await pool.query(
    `SELECT u.*, he.estado as ultimo_estado FROM unidades_transporte u
     LEFT JOIN (
       SELECT DISTINCT ON (entidad_id) entidad_id, estado
       FROM historial_estados
       WHERE entidad_tipo='UNIDAD'
       ORDER BY entidad_id, created_at DESC
     ) he ON he.entidad_id = u.id
     WHERE u.asociacion_id = $1`,
    [asociacion_id],
  );
  return res.rows;
};

const getTrazabilidadByAsociacion = async (
  asociacion_id,
  fecha_inicio,
  fecha_fin,
) => {
  let query = "SELECT * FROM registros_fiscalizacion WHERE asociacion_id = $1";
  const params = [asociacion_id];
  if (fecha_inicio) {
    params.push(fecha_inicio);
    query += ` AND fecha_hora_registro >= $${params.length}`;
  }
  if (fecha_fin) {
    params.push(fecha_fin);
    query += ` AND fecha_hora_registro <= $${params.length}`;
  }
  query += " ORDER BY fecha_hora_registro DESC";
  const res = await pool.query(query, params);
  return res.rows;
};

module.exports = {
  getMiembrosByAsociacion,
  getUnidadesByAsociacion,
  getTrazabilidadByAsociacion,
};
