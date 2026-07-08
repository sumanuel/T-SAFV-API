const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const createUser = async ({
  nombre,
  apellido,
  email,
  password,
  telefono,
  rif_cedula,
  direccion,
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const res = await pool.query(
    `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rif_cedula, direccion, rol)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'ADMIN')
     RETURNING id, nombre, apellido, email, telefono, rif_cedula, direccion, rol`,
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
  return res.rows[0];
};

const findUserByEmail = async (email) => {
  const res = await pool.query(
    "SELECT * FROM usuarios WHERE lower(email) = lower($1)",
    [email],
  );
  return res.rows[0];
};

const findUserById = async (userId) => {
  const res = await pool.query("SELECT * FROM usuarios WHERE id = $1", [userId]);
  return res.rows[0] || null;
};

const findReservedProfilesByEmail = async (email, db = pool) => {
  const res = await db.query(
    `SELECT
       'PROPIETARIO' AS rol_reservado,
       p.asociacion_id,
       a.nombre AS asociacion_nombre,
       p.estado_invitacion,
       p.usuario_id,
       p.membresia_id
     FROM propietarios p
     JOIN asociaciones a ON a.id = p.asociacion_id
     WHERE lower(p.email) = lower($1)
     UNION ALL
     SELECT
       'FISCAL' AS rol_reservado,
       f.asociacion_id,
       a.nombre AS asociacion_nombre,
       f.estado_invitacion,
       f.usuario_id,
       f.membresia_id
     FROM fiscales f
     JOIN asociaciones a ON a.id = f.asociacion_id
     WHERE lower(f.email) = lower($1)
     ORDER BY asociacion_id DESC`,
    [email],
  );

  return res.rows;
};

const getAssociationCreationAccess = async ({ userId, email }, db = pool) => {
  const reservations = email
    ? await findReservedProfilesByEmail(email, db)
    : [];

  if (reservations.length > 0) {
    const reservation = reservations[0];
    return {
      allowed: false,
      can_start_trial: false,
      has_valid_payment: false,
      trial_used: false,
      reason_code: "PROFILE_BLOCKED",
      preregistered_role: reservation.rol_reservado,
      preregistered_association_name: reservation.asociacion_nombre,
      invitation_state: reservation.estado_invitacion,
      message:
        reservation.estado_invitacion === "ACEPTADA"
          ? `Este correo ya pertenece a la asociación ${reservation.asociacion_nombre}.`
          : `Este correo ya fue registrado como ${reservation.rol_reservado.toLowerCase()} en la asociación ${reservation.asociacion_nombre}. Debes esperar la invitación oficial para activarlo.`,
    };
  }

  const existingAssociationRes = await db.query(
    "SELECT id, nombre FROM asociaciones WHERE creada_por = $1 ORDER BY id DESC LIMIT 1",
    [userId],
  );
  if (existingAssociationRes.rows[0]) {
    return {
      allowed: false,
      can_start_trial: false,
      has_valid_payment: true,
      trial_used: false,
      reason_code: "EXISTING_ASSOCIATION",
      preregistered_role: null,
      preregistered_association_name: existingAssociationRes.rows[0].nombre,
      invitation_state: null,
      message: "Cada administrador solo puede crear una asociación.",
    };
  }

  const entitlementRes = await db.query(
    `SELECT *
     FROM asociacion_pagos
     WHERE usuario_id = $1
     ORDER BY fecha_hasta DESC, id DESC
     LIMIT 1`,
    [userId],
  );
  const trialUsedRes = await db.query(
    `SELECT 1
     FROM asociacion_pagos
     WHERE usuario_id = $1 AND es_trial = TRUE
     LIMIT 1`,
    [userId],
  );

  const entitlement = entitlementRes.rows[0] || null;
  const today = new Date();
  const hasValidPayment = Boolean(
    entitlement &&
      entitlement.estado !== "INACTIVO" &&
      entitlement.fecha_hasta &&
      new Date(entitlement.fecha_hasta) >= new Date(today.toISOString().slice(0, 10)),
  );

  if (hasValidPayment) {
    return {
      allowed: true,
      can_start_trial: false,
      has_valid_payment: true,
      trial_used: Boolean(trialUsedRes.rows[0]),
      reason_code: entitlement.es_trial ? "TRIAL_ACTIVE" : "PAYMENT_ACTIVE",
      preregistered_role: null,
      preregistered_association_name: null,
      invitation_state: null,
      entitlement,
      message: entitlement.es_trial
        ? "Tu período de prueba está vigente para crear la asociación."
        : "Tienes un pago vigente para crear la asociación.",
    };
  }

  if (!entitlement) {
    return {
      allowed: true,
      can_start_trial: true,
      has_valid_payment: false,
      trial_used: false,
      reason_code: "TRIAL_AVAILABLE",
      preregistered_role: null,
      preregistered_association_name: null,
      invitation_state: null,
      entitlement: null,
      message:
        "No tienes un pago registrado. Se activará un período de prueba de 7 días al crear tu primera asociación.",
    };
  }

  return {
    allowed: false,
    can_start_trial: false,
    has_valid_payment: false,
    trial_used: Boolean(trialUsedRes.rows[0]),
    reason_code: entitlement.es_trial ? "TRIAL_ALREADY_USED" : "PAYMENT_REQUIRED",
    preregistered_role: null,
    preregistered_association_name: null,
    invitation_state: null,
    entitlement,
    message: entitlement.es_trial
      ? "El período de prueba ya fue utilizado y expiró. Debes registrar un pago vigente para crear una asociación."
      : "No tienes un pago vigente para crear una asociación.",
  };
};

const claimReservedUser = async (
  { nombre, apellido, email, password, telefono, rif_cedula, direccion },
  db = pool,
) => {
  const reservations = await findReservedProfilesByEmail(email, db);
  if (!reservations.length) return null;

  const userRes = await db.query(
    "SELECT * FROM usuarios WHERE lower(email) = lower($1) LIMIT 1",
    [email],
  );
  const user = userRes.rows[0];
  if (!user) return null;

  const hashedPassword = await bcrypt.hash(password, 10);
  const reservedRole = reservations[0].rol_reservado;
  const updatedRes = await db.query(
    `UPDATE usuarios
     SET nombre = $1,
         apellido = $2,
         password = $3,
         telefono = $4,
         rif_cedula = $5,
         direccion = $6,
         rol = $7
     WHERE id = $8
     RETURNING id, nombre, apellido, email, telefono, rif_cedula, direccion, rol`,
    [
      nombre || user.nombre,
      apellido || user.apellido || null,
      hashedPassword,
      telefono || user.telefono || null,
      rif_cedula || user.rif_cedula || null,
      direccion || user.direccion || null,
      reservedRole,
      user.id,
    ],
  );

  return {
    user: updatedRes.rows[0],
    reservations,
  };
};

const updateUserRole = async (userId, rol) => {
  const res = await pool.query(
    "UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING id, nombre, email, rol",
    [rol, userId],
  );
  return res.rows[0];
};

const updatePushToken = async (userId, pushToken) => {
  await pool.query("UPDATE usuarios SET push_token = $1 WHERE id = $2", [
    pushToken,
    userId,
  ]);
};

const findPushTokenByUserId = async (userId) => {
  const res = await pool.query(
    "SELECT push_token FROM usuarios WHERE id = $1",
    [userId],
  );
  return res.rows[0]?.push_token || null;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findReservedProfilesByEmail,
  getAssociationCreationAccess,
  claimReservedUser,
  updateUserRole,
  updatePushToken,
  findPushTokenByUserId,
};
