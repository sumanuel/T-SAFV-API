const unidadModel = require("../models/unidadModel");
const historyModel = require("../models/historyModel");

const create = async (req, res) => {
  const {
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
  } = req.body;
  const admin_id = req.user.id; // Asumimos que el admin está logueado y su id está en req.user

  try {
    const nuevaUnidad = await unidadModel.createUnidad(
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
    );
    res.status(201).json(nuevaUnidad);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating unidad", error: error.message });
  }
};

const changeState = async (req, res) => {
  const { unidad_id } = req.params;
  const { estado, motivo } = req.body;
  const admin_id = req.user.id;

  if (!["ACTIVO", "INACTIVO", "SUSPENDIDO"].includes(estado)) {
    return res.status(400).json({ message: "Invalid estado" });
  }

  try {
    const historyEntry = await historyModel.createHistoryEntry(
      unidad_id,
      "UNIDAD",
      estado,
      motivo,
      admin_id,
    );
    res.status(201).json(historyEntry);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error changing unidad state", error: error.message });
  }
};

module.exports = {
  create,
  changeState,
};
