const pool = require("../config/database");

const getMiembrosByAsociacion = async (asociacion_id) => {
  const res = await pool.query(
    `SELECT
       u.id,
       u.nombre,
       u.apellido,
       u.email,
       u.telefono,
       u.rif_cedula,
       u.direccion,
       m.id AS membresia_id,
       m.rol,
       COALESCE(he.estado, 'ACTIVO') AS estado_membresia,
       COALESCE(vehicle_data.linked_units, '[]'::json) AS linked_units
     FROM usuarios u
     JOIN membresias m ON m.usuario_id = u.id
     LEFT JOIN LATERAL (
       SELECT estado
       FROM historial_estados
       WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = m.id
       ORDER BY created_at DESC
       LIMIT 1
     ) he ON true
     LEFT JOIN LATERAL (
       SELECT json_agg(
         json_build_object(
           'id', unit.id,
           'placa', unit.placa,
           'ano', unit.ano,
           'marca', unit.marca,
           'modelo', unit.modelo,
           'color', unit.color,
           'uso', unit.uso,
           'capacidad', unit.capacidad,
           'serial_carroceria', unit.serial_carroceria,
           'serial_motor', unit.serial_motor,
           'numero_cilindros', unit.numero_cilindros,
           'peso', unit.peso,
           'numero_poliza_rcv', unit.numero_poliza_rcv,
           'numero_placa_asignada', unit.numero_placa_asignada,
           'fecha_emision', unit.fecha_emision,
           'chofer', unit.chofer,
           'numero_unidad', unit.numero_unidad,
           'numero_puestos', unit.numero_puestos
         )
         ORDER BY unit.numero_unidad NULLS LAST, unit.id
       ) AS linked_units
       FROM unidades_transporte unit
       WHERE unit.propietario_id = u.id AND unit.asociacion_id = m.asociacion_id
     ) vehicle_data ON true
     WHERE m.asociacion_id = $1`,
    [asociacion_id],
  );
  return res.rows;
};

const getUnidadesByAsociacion = async (asociacion_id) => {
  const res = await pool.query(
    `SELECT
       u.*,
       he.estado as ultimo_estado,
       owner.nombre AS propietario_nombre,
       owner.apellido AS propietario_apellido,
       owner.email AS propietario_email
     FROM unidades_transporte u
     LEFT JOIN usuarios owner ON owner.id = u.propietario_id
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
