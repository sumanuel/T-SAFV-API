const pool = require("../config/database");
const historyModel = require("./historyModel");

/**
 * Crea una nueva asociación y asigna al creador como el primer administrador.
 * Todo se ejecuta dentro de una transacción para garantizar la atomicidad.
 * @param {object} datosAsociacion - Datos de la asociación (nombre, rif, etc.).
 * @param {number} adminId - ID del usuario que está creando la asociación.
 * @returns {object} La nueva asociación creada.
 */
const createAsociacion = async (datosAsociacion, adminId) => {
  const {
    nombre,
    rif,
    direccion_fiscal,
    email,
    telefonos,
    logo_url,
    redes_sociales,
  } = datosAsociacion;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insertar la nueva asociación
    const asociacionRes = await client.query(
      `INSERT INTO asociaciones (nombre, rif, direccion_fiscal, email, telefonos, logo_url, redes_sociales, creada_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        nombre,
        rif,
        direccion_fiscal,
        email,
        telefonos,
        logo_url,
        redes_sociales,
        adminId,
      ],
    );
    const nuevaAsociacion = asociacionRes.rows[0];

    // 2. Crear la membresía para el administrador
    const membresiaRes = await client.query(
      `INSERT INTO membresias (usuario_id, asociacion_id, rol)
       VALUES ($1, $2, 'ADMIN')
       RETURNING id`,
      [adminId, nuevaAsociacion.id],
    );
    const nuevaMembresia = membresiaRes.rows[0];

    // 3. Registrar el estado inicial 'ACTIVO' para la membresía del admin
    await client.query(
      "INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id) VALUES ($1, $2, $3, $4, $5)",
      [
        nuevaMembresia.id,
        "MEMBRESIA",
        "ACTIVO",
        "Creación de asociación",
        adminId,
      ],
    );

    await client.query("COMMIT");
    return nuevaAsociacion;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getUserAssociations = async (userId) => {
  const res = await pool.query(
    `SELECT
        a.*,
        m.id AS membresia_id,
        m.rol,
        COALESCE(he.estado, 'ACTIVO') AS estado_membresia,
        COALESCE(metrics.admin_count, 0) AS admin_count,
        COALESCE(metrics.propietario_count, 0) AS propietario_count,
        COALESCE(metrics.fiscal_count, 0) AS fiscal_count,
        COALESCE(metrics.members_count, 0) AS members_count,
        COALESCE(units.units_count, 0) AS units_count,
        COALESCE(units.active_units_count, 0) AS active_units_count,
        COALESCE(trace.trazas_hoy, 0) AS trazas_hoy
     FROM asociaciones a
     JOIN membresias m ON m.asociacion_id = a.id
     LEFT JOIN LATERAL (
       SELECT estado
       FROM historial_estados
       WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = m.id
       ORDER BY created_at DESC
       LIMIT 1
     ) he ON true
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*) FILTER (WHERE mem.rol = 'ADMIN' AND COALESCE(mem_state.estado, 'ACTIVO') <> 'INACTIVO') AS admin_count,
         COUNT(*) FILTER (WHERE mem.rol = 'PROPIETARIO' AND COALESCE(mem_state.estado, 'ACTIVO') <> 'INACTIVO') AS propietario_count,
         COUNT(*) FILTER (WHERE mem.rol = 'FISCAL' AND COALESCE(mem_state.estado, 'ACTIVO') <> 'INACTIVO') AS fiscal_count,
         COUNT(*) FILTER (WHERE COALESCE(mem_state.estado, 'ACTIVO') <> 'INACTIVO') AS members_count
       FROM membresias mem
       LEFT JOIN LATERAL (
         SELECT estado
         FROM historial_estados
         WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = mem.id
         ORDER BY created_at DESC
         LIMIT 1
       ) mem_state ON true
       WHERE mem.asociacion_id = a.id
     ) metrics ON true
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*) AS units_count,
         COUNT(*) FILTER (WHERE COALESCE(unit_state.estado, 'ACTIVO') = 'ACTIVO') AS active_units_count
       FROM unidades_transporte u
       LEFT JOIN LATERAL (
         SELECT estado
         FROM historial_estados
         WHERE entidad_tipo = 'UNIDAD' AND entidad_id = u.id
         ORDER BY created_at DESC
         LIMIT 1
       ) unit_state ON true
       WHERE u.asociacion_id = a.id
     ) units ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS trazas_hoy
       FROM registros_fiscalizacion rf
       WHERE rf.asociacion_id = a.id
         AND DATE(rf.fecha_hora_registro) = CURRENT_DATE
     ) trace ON true
     WHERE m.usuario_id = $1
       AND COALESCE(he.estado, 'ACTIVO') <> 'INACTIVO'
     ORDER BY a.id DESC`,
    [userId],
  );

  return res.rows;
};

const updateAssociation = async (asociacionId, payload) => {
  const {
    nombre,
    rif,
    direccion_fiscal,
    email,
    telefonos,
    logo_url,
    redes_sociales,
  } = payload;

  const res = await pool.query(
    `UPDATE asociaciones
     SET nombre = $1,
         rif = $2,
         direccion_fiscal = $3,
         email = $4,
         telefonos = $5,
         logo_url = $6,
         redes_sociales = $7
     WHERE id = $8
     RETURNING *`,
    [
      nombre,
      rif || null,
      direccion_fiscal || null,
      email || null,
      telefonos || null,
      logo_url || null,
      redes_sociales || null,
      asociacionId,
    ],
  );

  return res.rows[0];
};

module.exports = {
  createAsociacion,
  getUserAssociations,
  updateAssociation,
};
