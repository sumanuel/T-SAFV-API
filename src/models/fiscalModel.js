const pool = require("../config/database");

const findActiveUnidadesByAsociacion = async (asociacion_id) => {
  const res = await pool.query(
    `SELECT u.*, he.estado as ultimo_estado FROM unidades_transporte u
     LEFT JOIN (
       SELECT DISTINCT ON (entidad_id) entidad_id, estado
       FROM historial_estados
       WHERE entidad_tipo='UNIDAD'
       ORDER BY entidad_id, created_at DESC
     ) he ON he.entidad_id = u.id
     WHERE u.asociacion_id = $1
     AND (he.estado IS NULL OR he.estado <> 'INACTIVO')`,
    [asociacion_id],
  );
  return res.rows;
};

const createRegistroFiscalizacion = async (
  unidad_id,
  fiscal_id,
  asociacion_id,
  chofer,
  origen,
  destino,
  pasajeros,
  fecha_hora_registro,
) => {
  const res = await pool.query(
    `INSERT INTO registros_fiscalizacion (unidad_id, fiscal_id, asociacion_id, chofer, origen, destino, pasajeros, fecha_hora_registro)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      unidad_id,
      fiscal_id,
      asociacion_id,
      chofer,
      origen,
      destino,
      pasajeros,
      fecha_hora_registro,
    ],
  );
  return res.rows[0];
};

module.exports = {
  findActiveUnidadesByAsociacion,
  createRegistroFiscalizacion,
};
