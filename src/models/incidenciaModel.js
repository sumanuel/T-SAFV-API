const pool = require("../config/database");

const SELECT_WITH_UNIT = `
  SELECT i.*, ut.placa, ut.numero_unidad, ut.propietario_id,
         ur.nombre AS reportada_por_nombre, ur.apellido AS reportada_por_apellido
  FROM incidencias i
  LEFT JOIN unidades_transporte ut ON ut.id = i.unidad_id
  LEFT JOIN usuarios ur ON ur.id = i.reportada_por`;

const unidadPerteneceAAsociacion = async (unidadId, asociacionId) => {
  const res = await pool.query(
    `SELECT 1 FROM unidades_transporte WHERE id = $1 AND asociacion_id = $2`,
    [unidadId, asociacionId],
  );
  return res.rowCount > 0;
};

const registroPerteneceAAsociacion = async (registroId, asociacionId) => {
  const res = await pool.query(
    `SELECT 1 FROM registros_fiscalizacion WHERE id = $1 AND asociacion_id = $2`,
    [registroId, asociacionId],
  );
  return res.rowCount > 0;
};

// Crea la incidencia. Con client_request_id, un reintento devuelve la original
// (duplicate: true) en vez de crear otra.
const create = async ({
  asociacionId,
  unidadId,
  registroId,
  tipo,
  descripcion,
  lugar,
  fechaHoraEvento,
  reportadaPor,
  clientRequestId,
}) => {
  const values = [
    asociacionId,
    unidadId || null,
    registroId || null,
    tipo,
    descripcion,
    lugar || null,
    fechaHoraEvento,
    reportadaPor,
    clientRequestId || null,
  ];

  const inserted = await pool.query(
    `INSERT INTO incidencias
       (asociacion_id, unidad_id, registro_id, tipo, descripcion, lugar,
        fecha_hora_evento, reportada_por, client_request_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (reportada_por, client_request_id) WHERE client_request_id IS NOT NULL
     DO NOTHING
     RETURNING *`,
    values,
  );

  if (inserted.rows[0]) return { incidencia: inserted.rows[0], duplicate: false };

  const existing = await pool.query(
    `SELECT * FROM incidencias WHERE reportada_por = $1 AND client_request_id = $2`,
    [reportadaPor, clientRequestId],
  );
  return { incidencia: existing.rows[0], duplicate: true };
};

const findById = async (id) => {
  const res = await pool.query(`${SELECT_WITH_UNIT} WHERE i.id = $1`, [id]);
  return res.rows[0] || null;
};

// Lista de una asociacion. Con propietarioId solo se devuelven las incidencias
// de unidades de ese propietario.
const list = async ({
  asociacionId,
  propietarioId,
  estado,
  tipo,
  unidadId,
  fechaInicio,
  fechaFin,
  limit = 100,
  offset = 0,
}) => {
  const params = [asociacionId];
  const where = ["i.asociacion_id = $1"];
  const add = (condition, value) => {
    params.push(value);
    where.push(condition.replace("?", `$${params.length}`));
  };

  if (propietarioId) add("ut.propietario_id = ?", propietarioId);
  if (estado) add("i.estado = ?", estado);
  if (tipo) add("i.tipo = ?", tipo);
  if (unidadId) add("i.unidad_id = ?", unidadId);
  if (fechaInicio) add("i.fecha_hora_evento >= ?", fechaInicio);
  if (fechaFin) add("i.fecha_hora_evento < (?::date + INTERVAL '1 day')", fechaFin);

  params.push(limit, offset);
  const res = await pool.query(
    `${SELECT_WITH_UNIT}
     WHERE ${where.join(" AND ")}
     ORDER BY i.fecha_hora_evento DESC, i.id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return res.rows;
};

const updateEstado = async (id, estado, usuarioId) => {
  const closing = estado === "CERRADA";
  const res = await pool.query(
    `UPDATE incidencias
     SET estado = $2,
         cerrada_por = $3,
         cerrada_at = CASE WHEN $4 THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, estado, closing ? usuarioId : null, closing],
  );
  return res.rows[0] || null;
};

module.exports = {
  unidadPerteneceAAsociacion,
  registroPerteneceAAsociacion,
  create,
  findById,
  list,
  updateEstado,
};
