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

// Todas las unidades del propietario en asociaciones donde su membresía está activa
const findMyUnidadesAllAssociations = async (propietario_id) => {
  const res = await pool.query(
    `SELECT u.*,
            a.nombre AS asociacion_nombre,
            a.id AS asociacion_id,
            COALESCE(he_u.estado, 'ACTIVO') AS ultimo_estado
     FROM unidades_transporte u
     JOIN asociaciones a ON a.id = u.asociacion_id
     JOIN membresias m ON m.usuario_id = $1 AND m.asociacion_id = u.asociacion_id
     LEFT JOIN LATERAL (
       SELECT estado FROM historial_estados
       WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = m.id
       ORDER BY created_at DESC LIMIT 1
     ) mem_state ON true
     LEFT JOIN LATERAL (
       SELECT estado FROM historial_estados
       WHERE entidad_tipo = 'UNIDAD' AND entidad_id = u.id
       ORDER BY created_at DESC LIMIT 1
     ) he_u ON true
     WHERE u.propietario_id = $1
       AND COALESCE(mem_state.estado, 'ACTIVO') <> 'INACTIVO'
       AND a.habilitada = TRUE
     ORDER BY a.id, u.id`,
    [propietario_id],
  );
  return res.rows;
};

// Trazabilidad de todas las unidades del propietario (cross-asociación)
const findMyTrazabilidadAllAssociations = async (
  propietario_id,
  fecha_inicio,
  fecha_fin,
  buscar,
) => {
  let query = `
    SELECT rf.*,
           ut.placa, ut.numero_unidad,
           a.nombre AS asociacion_nombre,
           uf.nombre AS fiscal_nombre
    FROM registros_fiscalizacion rf
    JOIN unidades_transporte ut ON ut.id = rf.unidad_id
    JOIN asociaciones a ON a.id = rf.asociacion_id
    LEFT JOIN usuarios uf ON uf.id = rf.fiscal_id
    JOIN membresias m ON m.usuario_id = $1 AND m.asociacion_id = rf.asociacion_id
    LEFT JOIN LATERAL (
      SELECT estado FROM historial_estados
      WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = m.id
      ORDER BY created_at DESC LIMIT 1
    ) mem_state ON true
    WHERE ut.propietario_id = $1
      AND COALESCE(mem_state.estado, 'ACTIVO') <> 'INACTIVO'
  `;
  const params = [propietario_id];

  if (fecha_inicio) {
    params.push(fecha_inicio);
    query += ` AND rf.fecha_hora_registro >= $${params.length}`;
  }
  if (fecha_fin) {
    params.push(fecha_fin);
    query += ` AND rf.fecha_hora_registro <= $${params.length}`;
  }
  if (buscar) {
    params.push(`%${buscar}%`);
    query += ` AND (ut.placa ILIKE $${params.length} OR ut.numero_unidad ILIKE $${params.length} OR uf.nombre ILIKE $${params.length})`;
  }

  query += " ORDER BY rf.fecha_hora_registro DESC";
  const res = await pool.query(query, params);
  return res.rows;
};

module.exports = {
  findMyUnidades,
  findTrazabilidadByUnidad,
  findMyUnidadesAllAssociations,
  findMyTrazabilidadAllAssociations,
};
