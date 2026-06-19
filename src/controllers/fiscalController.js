const fiscalModel = require("../models/fiscalModel");

const getUnidadesActivas = async (req, res) => {
  const asociacion_id = req.params.asociacion_id;
  try {
    const unidades =
      await fiscalModel.findActiveUnidadesByAsociacion(asociacion_id);
    res.json(unidades);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching unidades", error: error.message });
  }
};

const createRegistro = async (req, res) => {
  const { unidad_id, asociacion_id, chofer, destino, pasajeros } = req.body;
  const fiscal_id = req.user.id;
  const fecha_hora_registro = new Date();
  try {
    const registro = await fiscalModel.createRegistroFiscalizacion(
      unidad_id,
      fiscal_id,
      asociacion_id,
      chofer,
      destino,
      pasajeros,
      fecha_hora_registro,
    );
    res.status(201).json(registro);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating registro", error: error.message });
  }
};

module.exports = {
  getUnidadesActivas,
  createRegistro,
};
