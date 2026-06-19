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

module.exports = {
  createAsociacion,
};
