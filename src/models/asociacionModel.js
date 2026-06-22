const pool = require("../config/database");
const historyModel = require("./historyModel");
const bcrypt = require("bcryptjs");

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
    logo_data,
    redes_sociales,
  } = datosAsociacion;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insertar la nueva asociación
    const asociacionRes = await client.query(
      `INSERT INTO asociaciones (nombre, rif, direccion_fiscal, email, telefonos, logo_data, redes_sociales, creada_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        nombre,
        rif,
        direccion_fiscal,
        email,
        telefonos,
        logo_data,
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
    logo_data,
    redes_sociales,
  } = payload;

  const res = await pool.query(
    `UPDATE asociaciones
     SET nombre = $1,
         rif = $2,
         direccion_fiscal = $3,
         email = $4,
         telefonos = $5,
         logo_data = $6,
         redes_sociales = $7
     WHERE id = $8
     RETURNING *`,
    [
      nombre,
      rif || null,
      direccion_fiscal || null,
      email || null,
      telefonos || null,
      logo_data || null,
      redes_sociales || null,
      asociacionId,
    ],
  );

  return res.rows[0];
};

const createAssociationMember = async (asociacionId, payload, adminId) => {
  const { nombre, email, password, telefono, rif_cedula, direccion, rol } =
    payload;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingUserRes = await client.query(
      "SELECT * FROM usuarios WHERE email = $1 LIMIT 1",
      [email],
    );
    let user = existingUserRes.rows[0];

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userRes = await client.query(
        `INSERT INTO usuarios (nombre, email, password, telefono, rif_cedula, direccion)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, nombre, email, telefono, rif_cedula, direccion`,
        [
          nombre,
          email,
          hashedPassword,
          telefono || null,
          rif_cedula || null,
          direccion || null,
        ],
      );
      user = userRes.rows[0];
    }

    const existingMembershipRes = await client.query(
      "SELECT id FROM membresias WHERE usuario_id = $1 AND asociacion_id = $2 LIMIT 1",
      [user.id, asociacionId],
    );

    if (existingMembershipRes.rows[0]) {
      const error = new Error("Member already exists in this association");
      error.code = "MEMBER_EXISTS";
      throw error;
    }

    const membershipRes = await client.query(
      `INSERT INTO membresias (usuario_id, asociacion_id, rol)
       VALUES ($1, $2, $3)
       RETURNING id, usuario_id, asociacion_id, rol`,
      [user.id, asociacionId, rol],
    );
    const membership = membershipRes.rows[0];

    await client.query(
      "INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id) VALUES ($1, $2, $3, $4, $5)",
      [membership.id, "MEMBRESIA", "ACTIVO", "Creación directa", adminId],
    );

    await client.query("COMMIT");
    return {
      ...user,
      membresia_id: membership.id,
      rol: membership.rol,
      estado_membresia: "ACTIVO",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateAssociationMember = async (asociacionId, membresiaId, payload) => {
  const { nombre, email, password, telefono, rif_cedula, direccion, rol } =
    payload;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const membershipRes = await client.query(
      `SELECT m.*, u.id AS user_id
       FROM membresias m
       JOIN usuarios u ON u.id = m.usuario_id
       WHERE m.id = $1 AND m.asociacion_id = $2
       LIMIT 1`,
      [membresiaId, asociacionId],
    );
    const membership = membershipRes.rows[0];
    if (!membership) return null;

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const userRes = await client.query(
      `UPDATE usuarios
       SET nombre = $1,
           email = $2,
           telefono = $3,
           rif_cedula = $4,
           direccion = $5,
           password = COALESCE($6, password)
       WHERE id = $7
       RETURNING id, nombre, email, telefono, rif_cedula, direccion`,
      [
        nombre,
        email,
        telefono || null,
        rif_cedula || null,
        direccion || null,
        hashedPassword,
        membership.user_id,
      ],
    );

    await client.query(`UPDATE membresias SET rol = $1 WHERE id = $2`, [
      rol,
      membresiaId,
    ]);

    await client.query("COMMIT");
    return {
      ...userRes.rows[0],
      membresia_id: Number(membresiaId),
      rol,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createAsociacion,
  getUserAssociations,
  updateAssociation,
  createAssociationMember,
  updateAssociationMember,
};
