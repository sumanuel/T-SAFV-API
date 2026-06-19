const pool = require("../config/database");

const findMyUnidades = async (propietario_id, asociacion_id) => {
  const res = await pool.query(
    `SELECT u.*, he.estado as ultimo_estado FROM unidades_transporte u
     LEFT JOIN (
       SELECT DISTINCT ON (entidad_id) entidad_id, estado
       FROM historial_estados
       WHERE entidad_tipo='UNIDAD'
       ORDER BY entidad_id, created_at DESC
     ) he ON he.entidad_id = u.id
     WHERE u.propietario_id = $1 AND u.asociacion_id = $2`,
    [propietario_id, asociacion_id],
  );
  return res.rows;
};

const findTrazabilidadByUnidad = async (unidad_id, fecha_inicio, fecha_fin) => {
  let query = "SELECT * FROM registros_fiscalizacion WHERE unidad_id = $1";
  const params = [unidad_id];
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
  findMyUnidades,
  findTrazabilidadByUnidad,
};
