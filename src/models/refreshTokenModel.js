const pool = require("../config/database");

const create = async ({ usuarioId, tokenHash, expiresAt }, db = pool) => {
  const res = await db.query(
    `INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at)
     VALUES ($1, $2, $3) RETURNING id`,
    [usuarioId, tokenHash, expiresAt],
  );
  return res.rows[0];
};

const revokeAllForUser = async (usuarioId, db = pool) => {
  await db.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE usuario_id = $1 AND revoked_at IS NULL`,
    [usuarioId],
  );
};

const revokeByHash = async (tokenHash) => {
  const res = await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash],
  );
  return res.rowCount > 0;
};

// Rota un refresh token de forma atomica: el viejo queda revocado y se emite
// uno nuevo. Si llega un token ya revocado se asume robo/reuso y se revocan
// todas las sesiones del usuario.
const rotate = async ({ oldHash, newHash, newExpiresAt }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const found = await client.query(
      `SELECT id, usuario_id, expires_at, revoked_at
       FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE`,
      [oldHash],
    );
    const current = found.rows[0];

    if (!current) {
      await client.query("ROLLBACK");
      return { status: "invalid" };
    }

    if (current.revoked_at) {
      await revokeAllForUser(current.usuario_id, client);
      await client.query("COMMIT");
      return { status: "reused" };
    }

    if (new Date(current.expires_at) <= new Date()) {
      await client.query("ROLLBACK");
      return { status: "expired" };
    }

    const created = await create(
      { usuarioId: current.usuario_id, tokenHash: newHash, expiresAt: newExpiresAt },
      client,
    );
    await client.query(
      `UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by = $2 WHERE id = $1`,
      [current.id, created.id],
    );

    await client.query("COMMIT");
    return { status: "ok", usuarioId: current.usuario_id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { create, revokeAllForUser, revokeByHash, rotate };
