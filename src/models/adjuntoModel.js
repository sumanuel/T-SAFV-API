const pool = require("../config/database");

const META_COLUMNS =
  "id, entidad_tipo, entidad_id, mime, bytes, sha256, subido_por, created_at, purgado_at";

const create = async ({
  entidadTipo,
  entidadId,
  mime,
  bytes,
  sha256,
  contenido,
  subidoPor,
}) => {
  const res = await pool.query(
    `INSERT INTO adjuntos (entidad_tipo, entidad_id, mime, bytes, sha256, contenido, subido_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${META_COLUMNS}`,
    [entidadTipo, entidadId, mime, bytes, sha256, contenido, subidoPor],
  );
  return res.rows[0];
};

const findMeta = async (id) => {
  const res = await pool.query(
    `SELECT ${META_COLUMNS} FROM adjuntos WHERE id = $1`,
    [id],
  );
  return res.rows[0] || null;
};

const findContent = async (id) => {
  const res = await pool.query(
    `SELECT id, entidad_tipo, entidad_id, mime, bytes, contenido, purgado_at
     FROM adjuntos WHERE id = $1`,
    [id],
  );
  return res.rows[0] || null;
};

const listByEntities = async (entidadTipo, entidadIds) => {
  if (!entidadIds.length) return [];
  const res = await pool.query(
    `SELECT ${META_COLUMNS} FROM adjuntos
     WHERE entidad_tipo = $1 AND entidad_id = ANY($2::bigint[])
     ORDER BY id`,
    [entidadTipo, entidadIds],
  );
  return res.rows;
};

const countByEntity = async (entidadTipo, entidadId) => {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS n FROM adjuntos
     WHERE entidad_tipo = $1 AND entidad_id = $2`,
    [entidadTipo, entidadId],
  );
  return res.rows[0]?.n || 0;
};

// Datos de la entidad a la que se adjunta: asociacion, quien la creo y el
// propietario de la unidad (para decidir quien puede ver/subir).
const findEntityContext = async (entidadTipo, entidadId) => {
  const sql =
    entidadTipo === "REGISTRO"
      ? `SELECT rf.id, rf.asociacion_id, rf.fiscal_id AS creador_id, ut.propietario_id
         FROM registros_fiscalizacion rf
         LEFT JOIN unidades_transporte ut ON ut.id = rf.unidad_id
         WHERE rf.id = $1`
      : `SELECT i.id, i.asociacion_id, i.reportada_por AS creador_id, ut.propietario_id
         FROM incidencias i
         LEFT JOIN unidades_transporte ut ON ut.id = i.unidad_id
         WHERE i.id = $1`;
  const res = await pool.query(sql, [entidadId]);
  return res.rows[0] || null;
};

// Resumen para pintar miniaturas en Traza: {entidad_id, adjunto_id} de las
// fiscalizaciones que el usuario puede ver. Va aparte (no en los listados de
// traza) para que esas consultas no dependan de la migracion 0011.
const summaryForRegistros = async (registroIds, userId) => {
  if (!registroIds.length) return [];
  const res = await pool.query(
    `SELECT a.entidad_id, a.id AS adjunto_id
     FROM adjuntos a
     JOIN registros_fiscalizacion rf ON rf.id = a.entidad_id
     LEFT JOIN unidades_transporte ut ON ut.id = rf.unidad_id
     WHERE a.entidad_tipo = 'REGISTRO'
       AND a.entidad_id = ANY($1::bigint[])
       AND a.purgado_at IS NULL
       AND (
         ut.propietario_id = $2
         OR EXISTS (
           SELECT 1 FROM membresias m
           WHERE m.usuario_id = $2
             AND m.asociacion_id = rf.asociacion_id
             AND m.rol IN ('ADMIN', 'FISCAL')
         )
       )`,
    [registroIds, userId],
  );
  return res.rows;
};

module.exports = {
  create,
  findMeta,
  findContent,
  listByEntities,
  countByEntity,
  findEntityContext,
  summaryForRegistros,
};
