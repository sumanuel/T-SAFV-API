const propietarioModel = require("../models/propietarioModel");

const getMyUnidades = async (req, res) => {
  const propietario_id = req.user.id;
  const asociacion_id = req.params.asociacion_id;
  try {
    const unidades = await propietarioModel.findMyUnidades(
      propietario_id,
      asociacion_id,
    );
    res.json(unidades);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching units", error: error.message });
  }
};

const getTrazabilidad = async (req, res) => {
  const unidad_id = req.params.unidad_id;
  const { fecha_inicio, fecha_fin } = req.query;
  try {
    const rows = await propietarioModel.findTrazabilidadByUnidad(
      unidad_id,
      fecha_inicio,
      fecha_fin,
    );
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching trazabilidad", error: error.message });
  }
};

module.exports = {
  getMyUnidades,
  getTrazabilidad,
};
