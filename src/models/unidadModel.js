const pool = require("../config/database");
const historyModel = require("./historyModel");

const createUnidad = async (
  asociacion_id,
  propietario_id,
  placa,
  numero_unidad,
  numero_puestos,
  marca,
  modelo,
  ano,
  admin_id,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const unidadRes = await client.query(
      `INSERT INTO unidades_transporte (
         asociacion_id,
         propietario_id,
         placa,
         numero_unidad,
         numero_puestos,
         marca,
         modelo,
         ano
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        asociacion_id,
        propietario_id,
        placa,
        numero_unidad || null,
        numero_puestos || null,
        marca || null,
        modelo || null,
        ano || null,
      ],
    );
    const nuevaUnidad = unidadRes.rows[0];

    await historyModel.createHistoryEntry(
      nuevaUnidad.id,
      "UNIDAD",
      "ACTIVO",
      "Creación inicial",
      admin_id,
    );

    await client.query("COMMIT");
    return nuevaUnidad;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createUnidad,
};
