const pool = require("../config/database");
const historyModel = require("./historyModel");

const createUnidad = async (
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
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [
        asociacion_id,
        propietario_id,
        placa,
        numero_unidad || null,
        numero_puestos || null,
        color || null,
        uso || null,
        capacidad || null,
        serial_carroceria || null,
        serial_motor || null,
        numero_cilindros || null,
        peso || null,
        numero_poliza_rcv || null,
        numero_placa_asignada || null,
        fecha_emision || null,
        chofer || null,
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
