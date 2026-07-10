const pool = require("../config/database");
const crypto = require("crypto");

const createInvitacion = async (
  asociacion_id,
  email_invitado,
  rol_invitado,
  creada_por,
  diasValidez = 7,
) => {
  const token = crypto.randomBytes(24).toString("hex");
  const expira_en = new Date(Date.now() + diasValidez * 24 * 60 * 60 * 1000);
  const res = await pool.query(
    `INSERT INTO invitaciones (asociacion_id, email_invitado, rol_invitado, token_invitacion, estado, creada_por, expira_en)
     VALUES ($1, $2, $3, $4, 'PENDIENTE', $5, $6) RETURNING *`,
    [asociacion_id, email_invitado, rol_invitado, token, creada_por, expira_en],
  );

  if (rol_invitado === "PROPIETARIO") {
    await pool.query(
      `UPDATE propietarios
       SET estado_invitacion = 'INVITACION_ENVIADA',
           invitacion_enviada_at = NOW(),
           updated_at = NOW()
       WHERE asociacion_id = $1 AND lower(email) = lower($2)`,
      [asociacion_id, email_invitado],
    );
  }

  if (rol_invitado === "FISCAL") {
    await pool.query(
      `UPDATE fiscales
       SET estado_invitacion = 'INVITACION_ENVIADA',
           invitacion_enviada_at = NOW(),
           updated_at = NOW()
       WHERE asociacion_id = $1 AND lower(email) = lower($2)`,
      [asociacion_id, email_invitado],
    );
  }

  return res.rows[0];
};

const findPendingByEmail = async (email) => {
  const res = await pool.query(
    `SELECT
       i.*,
       a.nombre AS asociacion_nombre,
       a.rif AS asociacion_rif
     FROM invitaciones i
     JOIN asociaciones a ON a.id = i.asociacion_id
     WHERE lower(i.email_invitado) = lower($1) AND i.estado = $2
     ORDER BY i.created_at DESC NULLS LAST, i.id DESC`,
    [email, "PENDIENTE"],
  );
  return res.rows;
};

const findByAssociation = async (asociacionId) => {
  const res = await pool.query(
    `SELECT i.*, a.nombre AS asociacion_nombre
     FROM invitaciones i
     JOIN asociaciones a ON a.id = i.asociacion_id
     WHERE asociacion_id = $1
     ORDER BY created_at DESC NULLS LAST, id DESC`,
    [asociacionId],
  );
  return res.rows;
};

const cancelInvitation = async (invitationId, asociacionId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invitationRes = await client.query(
      `UPDATE invitaciones
       SET estado = 'CANCELADA'
       WHERE id = $1 AND asociacion_id = $2 AND estado = 'PENDIENTE'
       RETURNING *`,
      [invitationId, asociacionId],
    );
    const invitation = invitationRes.rows[0] || null;
    if (!invitation) {
      await client.query("ROLLBACK");
      return null;
    }

    if (invitation.rol_invitado === "PROPIETARIO") {
      await client.query(
        `UPDATE propietarios
         SET estado_invitacion = 'PENDIENTE_INVITACION',
             updated_at = NOW()
         WHERE asociacion_id = $1 AND lower(email) = lower($2)`,
        [asociacionId, invitation.email_invitado],
      );
    }

    if (invitation.rol_invitado === "FISCAL") {
      await client.query(
        `UPDATE fiscales
         SET estado_invitacion = 'PENDIENTE_INVITACION',
             updated_at = NOW()
         WHERE asociacion_id = $1 AND lower(email) = lower($2)`,
        [asociacionId, invitation.email_invitado],
      );
    }

    await client.query("COMMIT");
    return invitation;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const findByToken = async (token) => {
  const res = await pool.query(
    "SELECT * FROM invitaciones WHERE token_invitacion = $1 LIMIT 1",
    [token],
  );
  return res.rows[0];
};

const acceptInvitation = async (token, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invRes = await client.query(
      "SELECT * FROM invitaciones WHERE token_invitacion = $1 FOR UPDATE",
      [token],
    );
    const invitacion = invRes.rows[0];
    if (!invitacion) throw new Error("Invitation not found");
    if (invitacion.estado !== "PENDIENTE")
      throw new Error("Invitation not pending");
    if (invitacion.expira_en && new Date(invitacion.expira_en) < new Date())
      throw new Error("Invitation expired");

    // ADMIN y FISCAL solo pueden pertenecer a una asociación
    if (
      invitacion.rol_invitado === "ADMIN" ||
      invitacion.rol_invitado === "FISCAL"
    ) {
      const existingRes = await client.query(
        `SELECT m.id, m.asociacion_id, m.rol
         FROM membresias m
         JOIN historial_estados he ON he.entidad_tipo = 'MEMBRESIA' AND he.entidad_id = m.id
         WHERE m.usuario_id = $1
         GROUP BY m.id
         HAVING MAX(he.created_at) = (
           SELECT created_at FROM historial_estados
           WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = m.id
           ORDER BY created_at DESC LIMIT 1
         )
         AND (
           SELECT estado
           FROM historial_estados
           WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = m.id
           ORDER BY created_at DESC LIMIT 1
         ) <> 'INACTIVO'
         LIMIT 1`,
        [userId],
      );
      const existingMembership = existingRes.rows[0];
      if (
        existingMembership &&
        Number(existingMembership.asociacion_id) !==
          Number(invitacion.asociacion_id)
      ) {
        const error = new Error(
          "El correo ya pertenece a otra asociación. ADMIN y FISCAL solo pueden pertenecer a una.",
        );
        error.code = "SINGLE_ASSOCIATION_VIOLATION";
        throw error;
      }
    }

    await client.query(
      "UPDATE invitaciones SET estado = $1, aceptada_en = NOW() WHERE id = $2",
      ["ACEPTADA", invitacion.id],
    );

    const existingMembershipRes = await client.query(
      "SELECT id FROM membresias WHERE usuario_id = $1 AND asociacion_id = $2 LIMIT 1",
      [userId, invitacion.asociacion_id],
    );

    let membresia = existingMembershipRes.rows[0];
    let histRes;

    if (!membresia) {
      const membresiaRes = await client.query(
        "INSERT INTO membresias (usuario_id, asociacion_id, rol) VALUES ($1, $2, $3) RETURNING id",
        [userId, invitacion.asociacion_id, invitacion.rol_invitado],
      );
      membresia = membresiaRes.rows[0];

      histRes = await client.query(
        "INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [
          membresia.id,
          "MEMBRESIA",
          "ACTIVO",
          "Aceptación de invitación",
          userId,
        ],
      );
    } else {
      await client.query(
        `UPDATE membresias
         SET rol = $1
         WHERE id = $2`,
        [invitacion.rol_invitado, membresia.id],
      );

      const latestStateRes = await client.query(
        `SELECT estado
         FROM historial_estados
         WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [membresia.id],
      );

      if (latestStateRes.rows[0]?.estado !== "ACTIVO") {
        histRes = await client.query(
          "INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [
            membresia.id,
            "MEMBRESIA",
            "ACTIVO",
            "Aceptación de invitación",
            userId,
          ],
        );
      } else {
        await client.query(
          `UPDATE membresias
           SET rol = $1
           WHERE id = $2`,
          [invitacion.rol_invitado, membresia.id],
        );

        const latestStateRes = await client.query(
          `SELECT estado
           FROM historial_estados
           WHERE entidad_tipo = 'MEMBRESIA' AND entidad_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [membresia.id],
        );

        if (latestStateRes.rows[0]?.estado !== "ACTIVO") {
          histRes = await client.query(
            "INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [
              membresia.id,
              "MEMBRESIA",
              "ACTIVO",
              "Aceptación de invitación",
              userId,
            ],
          );
        }
      }
    }

    // Actualizar rol global del usuario si acepta como PROPIETARIO o FISCAL
    if (
      invitacion.rol_invitado === "PROPIETARIO" ||
      invitacion.rol_invitado === "FISCAL"
    ) {
      await client.query("UPDATE usuarios SET rol = $1 WHERE id = $2", [
        invitacion.rol_invitado,
        userId,
      ]);

      if (invitacion.rol_invitado === "PROPIETARIO") {
        await client.query(
          `UPDATE propietarios
           SET estado_invitacion = 'ACEPTADA',
               invitacion_aceptada_at = NOW(),
               updated_at = NOW()
           WHERE asociacion_id = $1 AND usuario_id = $2`,
          [invitacion.asociacion_id, userId],
        );
      }

      if (invitacion.rol_invitado === "FISCAL") {
        await client.query(
          `UPDATE fiscales
           SET estado_invitacion = 'ACEPTADA',
               invitacion_aceptada_at = NOW(),
               updated_at = NOW()
           WHERE asociacion_id = $1 AND usuario_id = $2`,
          [invitacion.asociacion_id, userId],
        );
      }
    }

    await client.query("COMMIT");
    const historial = histRes ? histRes.rows[0] : null;
    return {
      invitacion,
      membresia,
      historial,
      nuevoRol: invitacion.rol_invitado,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createInvitacion,
  findPendingByEmail,
  findByAssociation,
  findByToken,
  cancelInvitation,
  acceptInvitation,
};
