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

const updateUnidad = async (
  unidad_id,
  asociacion_id,
  propietario_id,
  placa,
  marca,
  modelo,
  ano,
  numero_unidad,
  numero_puestos,
  color,
  capacidad,
  serial_carroceria,
  serial_motor,
  numero_cilindros,
  peso,
  numero_poliza_rcv,
  numero_placa_asignada,
  fecha_emision,
  chofer,
) => {
  const res = await pool.query(
    `UPDATE unidades_transporte
     SET propietario_id = $1,
         placa = $2,
         marca = $3,
         modelo = $4,
         ano = $5,
         numero_unidad = $6,
         numero_puestos = $7,
         color = $8,
         capacidad = $9,
         serial_carroceria = $10,
         serial_motor = $11,
         numero_cilindros = $12,
         peso = $13,
         numero_poliza_rcv = $14,
         numero_placa_asignada = $15,
         fecha_emision = $16,
         chofer = $17
     WHERE id = $18 AND asociacion_id = $19
     RETURNING *`,
    [
      propietario_id,
      placa,
      marca || null,
      modelo || null,
      ano || null,
      numero_unidad || null,
      numero_puestos || null,
      color || null,
      capacidad || null,
      serial_carroceria || null,
      serial_motor || null,
      numero_cilindros || null,
      peso || null,
      numero_poliza_rcv || null,
      numero_placa_asignada || null,
      fecha_emision || null,
      chofer || null,
      unidad_id,
      asociacion_id,
    ],
  );

  return res.rows[0] || null;
};

const deleteUnidad = async (unidad_id, asociacion_id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const unidadRes = await client.query(
      `SELECT * FROM unidades_transporte WHERE id = $1 AND asociacion_id = $2 LIMIT 1`,
      [unidad_id, asociacion_id],
    );
    const unidad = unidadRes.rows[0];
    if (!unidad) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `DELETE FROM registros_fiscalizacion WHERE unidad_id = $1`,
      [unidad_id],
    );
    await client.query(
      `DELETE FROM historial_estados WHERE entidad_tipo = 'UNIDAD' AND entidad_id = $1`,
      [unidad_id],
    );
    await client.query(
      `DELETE FROM unidades_transporte WHERE id = $1 AND asociacion_id = $2`,
      [unidad_id, asociacion_id],
    );

    await client.query("COMMIT");
    return unidad;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createUnidad,
  updateUnidad,
  deleteUnidad,
};
