const pool = require("../config/database");

// Valores provisionales del PLAN-002 §6 mientras el negocio no defina otros:
// fotos de pasajeros 90 dias; fotos de incidencias 12 meses tras el cierre.
const DEFAULT_DIAS_FOTO_REGISTRO = 90;
const DEFAULT_MESES_FOTO_INCIDENCIA = 12;

// Variable sin definir (o con un valor invalido) = el valor por defecto;
// "0" = esa retencion queda desactivada (no se borra nada de ese tipo).
const readLimit = (value, fallback) => {
  if (value === undefined || String(value).trim() === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return fallback;
  return n === 0 ? null : n;
};

const readRetentionConfig = (env = process.env) => ({
  diasFotoRegistro: readLimit(
    env.RETENCION_DIAS_FOTO_REGISTRO,
    DEFAULT_DIAS_FOTO_REGISTRO,
  ),
  mesesFotoIncidencia: readLimit(
    env.RETENCION_MESES_FOTO_INCIDENCIA,
    DEFAULT_MESES_FOTO_INCIDENCIA,
  ),
});

const SUMMARY = (rows) => ({
  count: rows.length,
  bytes: rows.reduce((sum, row) => sum + Number(row.bytes || 0), 0),
  ids: rows.map((row) => row.id),
});

// Fotos de fiscalizacion con mas de N dias.
const findExpiredRegistroPhotos = async (days, db) => {
  const res = await db.query(
    `SELECT id, bytes FROM adjuntos
     WHERE entidad_tipo = 'REGISTRO'
       AND purgado_at IS NULL
       AND created_at < NOW() - make_interval(days => $1)`,
    [days],
  );
  return res.rows;
};

// Fotos de incidencias CERRADAS hace mas de N meses (las abiertas o en revision
// nunca se purgan: son evidencia de un caso en curso).
const findExpiredIncidenciaPhotos = async (months, db) => {
  const res = await db.query(
    `SELECT a.id, a.bytes
     FROM adjuntos a
     JOIN incidencias i ON i.id = a.entidad_id
     WHERE a.entidad_tipo = 'INCIDENCIA'
       AND a.purgado_at IS NULL
       AND i.estado = 'CERRADA'
       AND i.cerrada_at < NOW() - make_interval(months => $1)`,
    [months],
  );
  return res.rows;
};

// Calcula (y, con apply, ejecuta) la purga. Se borra el contenido pero se
// conserva la fila con purgado_at, para que la app muestre "foto eliminada".
const purgeExpired = async ({ config = readRetentionConfig(), apply = false, db = pool } = {}) => {
  const summary = { applied: false, configured: false, registro: null, incidencia: null };

  const expired = [];
  if (config.diasFotoRegistro) {
    summary.configured = true;
    const rows = await findExpiredRegistroPhotos(config.diasFotoRegistro, db);
    summary.registro = SUMMARY(rows);
    expired.push(...rows.map((row) => row.id));
  }
  if (config.mesesFotoIncidencia) {
    summary.configured = true;
    const rows = await findExpiredIncidenciaPhotos(config.mesesFotoIncidencia, db);
    summary.incidencia = SUMMARY(rows);
    expired.push(...rows.map((row) => row.id));
  }

  if (apply && expired.length) {
    await db.query(
      `UPDATE adjuntos SET contenido = NULL, purgado_at = NOW()
       WHERE id = ANY($1::bigint[]) AND purgado_at IS NULL`,
      [expired],
    );
    summary.applied = true;
  }
  return summary;
};

module.exports = { readRetentionConfig, purgeExpired };
