const pool = require("../config/database");
const historyModel = require("./historyModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const userModel = require("./userModel");

const ACCEPTED_INVITATION_STATE = "ACEPTADA";

const ensureAssociationCreationEntitlement = async (client, adminId, email) => {
  const access = await userModel.getAssociationCreationAccess(
    { userId: adminId, email },
    client,
  );

  if (!access.allowed) {
    const error = new Error(access.message);
    error.code = access.reason_code;
    throw error;
  }

  if (access.entitlement) {
    return access.entitlement;
  }

  const entitlementRes = await client.query(
    `INSERT INTO asociacion_pagos (
       asociacion_id,
       usuario_id,
       monto,
       moneda,
       fecha_desde,
       fecha_hasta,
       referencia,
       notas,
       estado,
       registrado_por_usuario_id,
       es_trial
     ) VALUES (
       NULL,
       $1,
       NULL,
       'USD',
       CURRENT_DATE,
       (CURRENT_DATE + INTERVAL '7 days')::date,
       'TRIAL-AUTO',
       'Período de prueba automático por primera asociación',
       'ACTIVO',
       $1,
       TRUE
     )
     RETURNING *`,
    [adminId],
  );

  return entitlementRes.rows[0];
};

const upsertRoleProfile = async (
  client,
  { asociacionId, membershipId, user, rol, payload },
) => {
  const invitationState = payload.estado_invitacion || "PENDIENTE_INVITACION";

  if (rol === "PROPIETARIO") {
    await client.query(
      `DELETE FROM fiscales WHERE asociacion_id = $1 AND usuario_id = $2`,
      [asociacionId, user.id],
    );
    await client.query(
      `INSERT INTO propietarios (
         asociacion_id,
         usuario_id,
         membresia_id,
         nombre,
         apellido,
         email,
         telefono,
         rif_cedula,
         direccion,
         estado_invitacion,
         invitacion_enviada_at,
         invitacion_aceptada_at,
         updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         CASE WHEN $10 = 'INVITACION_ENVIADA' THEN NOW() ELSE NULL END,
         CASE WHEN $10 = 'ACEPTADA' THEN NOW() ELSE NULL END,
         NOW()
       )
       ON CONFLICT (asociacion_id, usuario_id)
       DO UPDATE SET
         membresia_id = EXCLUDED.membresia_id,
         nombre = EXCLUDED.nombre,
         apellido = EXCLUDED.apellido,
         email = EXCLUDED.email,
         telefono = EXCLUDED.telefono,
         estado_invitacion = EXCLUDED.estado_invitacion,
         invitacion_enviada_at = CASE WHEN EXCLUDED.estado_invitacion = 'INVITACION_ENVIADA' THEN NOW() ELSE propietarios.invitacion_enviada_at END,
         invitacion_aceptada_at = CASE WHEN EXCLUDED.estado_invitacion = 'ACEPTADA' THEN NOW() ELSE propietarios.invitacion_aceptada_at END,
         rif_cedula = EXCLUDED.rif_cedula,
         direccion = EXCLUDED.direccion,
         updated_at = NOW()`,
      [
        asociacionId,
        user.id,
        membershipId,
        payload.nombre,
        payload.apellido || null,
        payload.email,
        payload.telefono || null,
        payload.rif_cedula || null,
        payload.direccion || null,
        invitationState,
      ],
    );
    return;
  }

  if (rol === "FISCAL") {
    await client.query(
      `DELETE FROM propietarios WHERE asociacion_id = $1 AND usuario_id = $2`,
      [asociacionId, user.id],
    );
    await client.query(
      `INSERT INTO fiscales (
         asociacion_id,
         usuario_id,
         membresia_id,
         nombre,
         apellido,
         email,
         telefono,
         rif_cedula,
         direccion,
         punto_control,
         estado_invitacion,
         invitacion_enviada_at,
         invitacion_aceptada_at,
         updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         CASE WHEN $11 = 'INVITACION_ENVIADA' THEN NOW() ELSE NULL END,
         CASE WHEN $11 = 'ACEPTADA' THEN NOW() ELSE NULL END,
         NOW()
       )
       ON CONFLICT (asociacion_id, usuario_id)
       DO UPDATE SET
         membresia_id = EXCLUDED.membresia_id,
         nombre = EXCLUDED.nombre,
         apellido = EXCLUDED.apellido,
         email = EXCLUDED.email,
         telefono = EXCLUDED.telefono,
         rif_cedula = EXCLUDED.rif_cedula,
         direccion = EXCLUDED.direccion,
         punto_control = EXCLUDED.punto_control,
         estado_invitacion = EXCLUDED.estado_invitacion,
         invitacion_enviada_at = CASE WHEN EXCLUDED.estado_invitacion = 'INVITACION_ENVIADA' THEN NOW() ELSE fiscales.invitacion_enviada_at END,
         invitacion_aceptada_at = CASE WHEN EXCLUDED.estado_invitacion = 'ACEPTADA' THEN NOW() ELSE fiscales.invitacion_aceptada_at END,
         updated_at = NOW()`,
      [
        asociacionId,
        user.id,
        membershipId,
        payload.nombre,
        payload.apellido || null,
        payload.email,
        payload.telefono || null,
        payload.rif_cedula || null,
        payload.direccion || null,
        payload.punto_control || null,
        invitationState,
      ],
    );
  }
};

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
    logo_data,
    redes_sociales,
  } = datosAsociacion;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingAssociationRes = await client.query(
      `SELECT id FROM asociaciones WHERE creada_por = $1 LIMIT 1`,
      [adminId],
    );

    if (existingAssociationRes.rows[0]) {
      const error = new Error("Admin already has an association");
      error.code = "ADMIN_ASSOCIATION_EXISTS";
      throw error;
    }

    const adminUser = await userModel.findUserById(adminId);
    const entitlement = await ensureAssociationCreationEntitlement(
      client,
      adminId,
      adminUser?.email,
    );

    // 1. Insertar la nueva asociación
    const asociacionRes = await client.query(
      `INSERT INTO asociaciones (
         nombre,
         rif,
         direccion_fiscal,
         email,
         telefonos,
         logo_url,
         logo_data,
         redes_sociales,
         creada_por,
         trial_inicio,
         trial_fin
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        nombre,
        rif,
        direccion_fiscal,
        email,
        telefonos,
        logo_url || null,
        logo_data,
        redes_sociales,
        adminId,
        entitlement.es_trial ? entitlement.fecha_desde : null,
        entitlement.es_trial ? entitlement.fecha_hasta : null,
      ],
    );
    const nuevaAsociacion = asociacionRes.rows[0];

    await client.query(
      `UPDATE asociacion_pagos
       SET asociacion_id = $1,
           consumido_en = COALESCE(consumido_en, NOW())
       WHERE id = $2`,
      [nuevaAsociacion.id, entitlement.id],
    );

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
        COALESCE(trace.trazas_hoy, 0) AS trazas_hoy,
        payment.fecha_desde AS licencia_desde,
        payment.fecha_hasta AS licencia_hasta,
        payment.estado AS licencia_estado,
        a.trial_inicio,
        a.trial_fin,
        CASE
          WHEN a.habilitada = FALSE THEN FALSE
          WHEN a.trial_fin IS NOT NULL AND a.trial_fin >= CURRENT_TIMESTAMP THEN TRUE
          ELSE payment.fecha_hasta >= CURRENT_DATE
        END AS disponible_app
     FROM asociaciones a
     JOIN membresias m ON m.asociacion_id = a.id
     LEFT JOIN propietarios owner_profile
       ON owner_profile.asociacion_id = a.id AND owner_profile.usuario_id = m.usuario_id
     LEFT JOIN fiscales fiscal_profile
       ON fiscal_profile.asociacion_id = a.id AND fiscal_profile.usuario_id = m.usuario_id
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
       SELECT fecha_desde, fecha_hasta, estado
       FROM asociacion_pagos ap
       WHERE ap.asociacion_id = a.id
       ORDER BY fecha_hasta DESC, id DESC
       LIMIT 1
     ) payment ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS trazas_hoy
       FROM registros_fiscalizacion rf
       WHERE rf.asociacion_id = a.id
         AND DATE(rf.fecha_hora_registro) = CURRENT_DATE
     ) trace ON true
     WHERE m.usuario_id = $1
       AND COALESCE(he.estado, 'ACTIVO') <> 'INACTIVO'
       AND (
         m.rol = 'ADMIN'
         OR (m.rol = 'PROPIETARIO' AND COALESCE(owner_profile.estado_invitacion, 'PENDIENTE_INVITACION') = 'ACEPTADA')
         OR (m.rol = 'FISCAL' AND COALESCE(fiscal_profile.estado_invitacion, 'PENDIENTE_INVITACION') = 'ACEPTADA')
       )
       AND a.habilitada = TRUE
       AND (
         (a.trial_fin IS NOT NULL AND a.trial_fin >= CURRENT_TIMESTAMP)
         OR payment.fecha_hasta >= CURRENT_DATE
       )
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
    logo_data,
    redes_sociales,
    habilitada,
  } = payload;

  const res = await pool.query(
    `UPDATE asociaciones
     SET nombre = $1,
         rif = $2,
         direccion_fiscal = $3,
         email = $4,
         telefonos = $5,
         logo_url = $6,
         logo_data = $7,
         redes_sociales = $8,
         habilitada = COALESCE($9, habilitada)
     WHERE id = $10
     RETURNING *`,
    [
      nombre,
      rif || null,
      direccion_fiscal || null,
      email || null,
      telefonos || null,
      logo_url || null,
      logo_data || null,
      redes_sociales || null,
      typeof habilitada === "boolean" ? habilitada : null,
      asociacionId,
    ],
  );

  return res.rows[0];
};

const createOwnerUnits = async (
  client,
  vehicles,
  ownerId,
  asociacionId,
  adminId,
) => {
  const createdUnits = [];

  for (const vehicle of vehicles || []) {
    if (!vehicle?.placa || !vehicle?.numero_unidad) {
      continue;
    }

    const unitRes = await client.query(
      `INSERT INTO unidades_transporte (
         asociacion_id,
         propietario_id,
         placa,
         numero_unidad,
         numero_puestos,
         color,
         uso,
         capacidad,
         serial_carroceria,
         serial_motor,
         numero_cilindros,
         peso,
         numero_poliza_rcv,
         numero_placa_asignada,
         fecha_emision,
         chofer,
         marca,
         modelo,
         ano
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        asociacionId,
        ownerId,
        vehicle.placa,
        vehicle.numero_unidad,
        vehicle.numero_puestos || vehicle.capacidad || null,
        vehicle.color || null,
        vehicle.uso || null,
        vehicle.capacidad || null,
        vehicle.serial_carroceria || null,
        vehicle.serial_motor || null,
        vehicle.numero_cilindros || null,
        vehicle.peso || null,
        vehicle.numero_poliza_rcv || null,
        vehicle.numero_placa_asignada || null,
        vehicle.fecha_emision || null,
        vehicle.chofer || null,
        vehicle.marca || null,
        vehicle.modelo || null,
        vehicle.ano || null,
      ],
    );

    const createdUnit = unitRes.rows[0];
    createdUnits.push(createdUnit);

    await client.query(
      "INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id) VALUES ($1, $2, $3, $4, $5)",
      [
        createdUnit.id,
        "UNIDAD",
        "ACTIVO",
        "Creación desde propietario",
        adminId,
      ],
    );
  }

  return createdUnits;
};

const upsertOwnerUnits = async (
  client,
  vehicles,
  ownerId,
  asociacionId,
  adminId,
) => {
  const result = [];

  for (const vehicle of vehicles || []) {
    if (!vehicle?.placa || !vehicle?.numero_unidad) continue;

    if (vehicle.id) {
      const updateRes = await client.query(
        `UPDATE unidades_transporte
         SET placa = $1,
             numero_unidad = $2,
             numero_puestos = $3,
             color = $4,
             uso = $5,
             capacidad = $6,
             serial_carroceria = $7,
             serial_motor = $8,
             numero_cilindros = $9,
             peso = $10,
             numero_poliza_rcv = $11,
             numero_placa_asignada = $12,
             fecha_emision = $13,
             chofer = $14,
             marca = $15,
             modelo = $16,
             ano = $17,
             propietario_id = $18
         WHERE id = $19 AND asociacion_id = $20
         RETURNING *`,
        [
          vehicle.placa,
          vehicle.numero_unidad,
          vehicle.numero_puestos || vehicle.capacidad || null,
          vehicle.color || null,
          vehicle.uso || null,
          vehicle.capacidad || null,
          vehicle.serial_carroceria || null,
          vehicle.serial_motor || null,
          vehicle.numero_cilindros || null,
          vehicle.peso || null,
          vehicle.numero_poliza_rcv || null,
          vehicle.numero_placa_asignada || null,
          vehicle.fecha_emision || null,
          vehicle.chofer || null,
          vehicle.marca || null,
          vehicle.modelo || null,
          vehicle.ano || null,
          ownerId,
          vehicle.id,
          asociacionId,
        ],
      );

      if (updateRes.rows[0]) {
        result.push(updateRes.rows[0]);
        continue;
      }
    }

    const created = await createOwnerUnits(
      client,
      [vehicle],
      ownerId,
      asociacionId,
      adminId,
    );
    result.push(...created);
  }

  return result;
};

const createAssociationMember = async (asociacionId, payload, adminId) => {
  const {
    nombre,
    apellido,
    email,
    password,
    telefono,
    rif_cedula,
    direccion,
    punto_control,
    estado_invitacion,
    rol,
    vehicles,
  } = payload;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingUserRes = await client.query(
      "SELECT * FROM usuarios WHERE email = $1 LIMIT 1",
      [email],
    );
    let user = existingUserRes.rows[0];

    if (!user) {
      const temporaryPassword =
        password || crypto.randomBytes(12).toString("hex");
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      const userRes = await client.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rif_cedula, direccion)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, nombre, apellido, email, telefono, rif_cedula, direccion`,
        [
          nombre,
          apellido || null,
          email,
          hashedPassword,
          telefono || null,
          rif_cedula || null,
          direccion || null,
        ],
      );
      user = userRes.rows[0];
    } else {
      const userRes = await client.query(
        `UPDATE usuarios
         SET nombre = COALESCE($1, nombre),
             apellido = COALESCE($2, apellido),
             telefono = COALESCE($3, telefono),
             rif_cedula = COALESCE($4, rif_cedula),
             direccion = COALESCE($5, direccion)
         WHERE id = $6
         RETURNING id, nombre, apellido, email, telefono, rif_cedula, direccion`,
        [
          nombre || null,
          apellido || null,
          telefono || null,
          rif_cedula || null,
          direccion || null,
          user.id,
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

    await upsertRoleProfile(client, {
      asociacionId,
      membershipId: membership.id,
      user,
      rol,
      payload: {
        nombre,
        apellido,
        email,
        telefono,
        rif_cedula,
        direccion,
        punto_control,
        estado_invitacion,
      },
    });

    const linkedUnits =
      rol === "PROPIETARIO"
        ? await createOwnerUnits(
            client,
            vehicles,
            user.id,
            asociacionId,
            adminId,
          )
        : [];

    await client.query("COMMIT");
    return {
      ...user,
      membresia_id: membership.id,
      rol: membership.rol,
      estado_membresia: "ACTIVO",
      linked_units: linkedUnits,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateAssociationMember = async (asociacionId, membresiaId, payload) => {
  const {
    nombre,
    apellido,
    email,
    password,
    telefono,
    rif_cedula,
    direccion,
    punto_control,
    estado_invitacion,
    rol,
    vehicles,
  } = payload;
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
           apellido = $2,
           email = $3,
           telefono = $4,
           rif_cedula = $5,
           direccion = $6,
           password = COALESCE($7, password)
       WHERE id = $8
       RETURNING id, nombre, apellido, email, telefono, rif_cedula, direccion`,
      [
        nombre,
        apellido || null,
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

    await upsertRoleProfile(client, {
      asociacionId,
      membershipId: membership.id,
      user: { id: membership.user_id },
      rol,
      payload: {
        nombre,
        apellido,
        email,
        telefono,
        rif_cedula,
        direccion,
        punto_control,
        estado_invitacion,
      },
    });

    const linkedUnits =
      rol === "PROPIETARIO"
        ? await upsertOwnerUnits(
            client,
            vehicles,
            membership.user_id,
            asociacionId,
            membership.user_id,
          )
        : [];

    await client.query("COMMIT");
    return {
      ...userRes.rows[0],
      membresia_id: Number(membresiaId),
      rol,
      linked_units: linkedUnits,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteAssociationMember = async (asociacionId, membresiaId) => {
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
    if (!membership) {
      await client.query("ROLLBACK");
      return null;
    }

    const associationRes = await client.query(
      `SELECT creada_por FROM asociaciones WHERE id = $1 LIMIT 1`,
      [asociacionId],
    );
    if (associationRes.rows[0]?.creada_por === membership.user_id) {
      const error = new Error(
        "El creador de la asociación no se puede dar de baja.",
      );
      error.code = "ASSOCIATION_CREATOR_PROTECTED";
      throw error;
    }

    if (membership.rol === "PROPIETARIO") {
      await client.query(
        `DELETE FROM propietarios WHERE asociacion_id = $1 AND usuario_id = $2`,
        [asociacionId, membership.user_id],
      );
      const unitsRes = await client.query(
        `SELECT id FROM unidades_transporte WHERE asociacion_id = $1 AND propietario_id = $2`,
        [asociacionId, membership.user_id],
      );
      for (const unit of unitsRes.rows) {
        await client.query(
          `DELETE FROM registros_fiscalizacion WHERE unidad_id = $1`,
          [unit.id],
        );
        await client.query(
          `DELETE FROM historial_estados WHERE entidad_tipo = 'UNIDAD' AND entidad_id = $1`,
          [unit.id],
        );
      }
      await client.query(
        `DELETE FROM unidades_transporte WHERE asociacion_id = $1 AND propietario_id = $2`,
        [asociacionId, membership.user_id],
      );
    }

    if (membership.rol === "FISCAL") {
      await client.query(
        `DELETE FROM fiscales WHERE asociacion_id = $1 AND usuario_id = $2`,
        [asociacionId, membership.user_id],
      );
    }

    await client.query(
      `DELETE FROM historial_estados WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = $1`,
      [membresiaId],
    );
    await client.query(
      `DELETE FROM membresias WHERE id = $1 AND asociacion_id = $2`,
      [membresiaId, asociacionId],
    );

    await client.query("COMMIT");
    return membership;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const listAssociationPayments = async (asociacionId) => {
  const res = await pool.query(
    `SELECT * FROM asociacion_pagos
     WHERE asociacion_id = $1
     ORDER BY fecha_hasta DESC, id DESC`,
    [asociacionId],
  );
  return res.rows;
};

const createAssociationPayment = async (asociacionId, payload, userId) => {
  const { monto, moneda, fecha_desde, fecha_hasta, referencia, notas, estado } =
    payload;

  const res = await pool.query(
    `INSERT INTO asociacion_pagos (
       asociacion_id,
       monto,
       moneda,
       fecha_desde,
       fecha_hasta,
       referencia,
       notas,
       estado,
       registrado_por_usuario_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      asociacionId,
      monto || null,
      moneda || "USD",
      fecha_desde,
      fecha_hasta,
      referencia || null,
      notas || null,
      estado || "ACTIVO",
      userId,
    ],
  );

  return res.rows[0];
};

const activateTrial = async (asociacionId, adminId) => {
  // Verifica que no haya trial ya usado ni pago vigente
  const existing = await pool.query(
    `SELECT trial_fin, id FROM asociaciones WHERE id = $1 AND creada_por = $2 LIMIT 1`,
    [asociacionId, adminId],
  );
  const asoc = existing.rows[0];
  if (!asoc) {
    const err = new Error("Asociación no encontrada o sin permisos");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (asoc.trial_fin) {
    const err = new Error("El período de prueba ya fue utilizado");
    err.code = "TRIAL_ALREADY_USED";
    throw err;
  }
  const res = await pool.query(
    `UPDATE asociaciones
     SET trial_inicio = NOW(),
         trial_fin = NOW() + INTERVAL '7 days'
     WHERE id = $1
     RETURNING id, trial_inicio, trial_fin`,
    [asociacionId],
  );

  await pool.query(
    `INSERT INTO asociacion_pagos (
       asociacion_id,
       usuario_id,
       monto,
       moneda,
       fecha_desde,
       fecha_hasta,
       referencia,
       notas,
       estado,
       registrado_por_usuario_id,
       es_trial,
       consumido_en
     ) VALUES (
       $1,
       $2,
       NULL,
       'USD',
       CURRENT_DATE,
       (CURRENT_DATE + INTERVAL '7 days')::date,
       'TRIAL-MANUAL',
       'Activación manual de período de prueba',
       'ACTIVO',
       $2,
       TRUE,
       NOW()
     )
     ON CONFLICT DO NOTHING`,
    [asociacionId, adminId],
  );

  return res.rows[0];
};

// Devuelve TODAS las asociaciones del usuario, incluyendo expiradas (para modo solo-lectura)
const getUserAssociationsAll = async (userId) => {
  const res = await pool.query(
    `SELECT
        a.*,
        m.id AS membresia_id,
        m.rol,
        COALESCE(he.estado, 'ACTIVO') AS estado_membresia,
        payment.fecha_desde AS licencia_desde,
        payment.fecha_hasta AS licencia_hasta,
        payment.estado AS licencia_estado,
        a.trial_inicio,
        a.trial_fin,
        CASE
          WHEN a.habilitada = FALSE THEN FALSE
          WHEN a.trial_fin IS NOT NULL AND a.trial_fin >= CURRENT_TIMESTAMP THEN TRUE
          ELSE payment.fecha_hasta >= CURRENT_DATE
        END AS disponible_app
     FROM asociaciones a
     JOIN membresias m ON m.asociacion_id = a.id
     LEFT JOIN propietarios owner_profile
       ON owner_profile.asociacion_id = a.id AND owner_profile.usuario_id = m.usuario_id
     LEFT JOIN fiscales fiscal_profile
       ON fiscal_profile.asociacion_id = a.id AND fiscal_profile.usuario_id = m.usuario_id
     LEFT JOIN LATERAL (
       SELECT estado
       FROM historial_estados
       WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = m.id
       ORDER BY created_at DESC LIMIT 1
     ) he ON true
     LEFT JOIN LATERAL (
       SELECT fecha_desde, fecha_hasta, estado
       FROM asociacion_pagos ap
       WHERE ap.asociacion_id = a.id
       ORDER BY fecha_hasta DESC, id DESC LIMIT 1
     ) payment ON true
     WHERE m.usuario_id = $1
       AND COALESCE(he.estado, 'ACTIVO') <> 'INACTIVO'
       AND (
         m.rol = 'ADMIN'
         OR (m.rol = 'PROPIETARIO' AND COALESCE(owner_profile.estado_invitacion, 'PENDIENTE_INVITACION') = 'ACEPTADA')
         OR (m.rol = 'FISCAL' AND COALESCE(fiscal_profile.estado_invitacion, 'PENDIENTE_INVITACION') = 'ACEPTADA')
       )
       AND a.habilitada = TRUE
     ORDER BY a.id DESC`,
    [userId],
  );
  return res.rows;
};

module.exports = {
  createAsociacion,
  getUserAssociations,
  getUserAssociationsAll,
  activateTrial,
  updateAssociation,
  createAssociationMember,
  updateAssociationMember,
  deleteAssociationMember,
  createOwnerUnits,
  upsertOwnerUnits,
  listAssociationPayments,
  createAssociationPayment,
};
