const fiscalModel = require("../models/fiscalModel");
const { resolveCaptureTime } = require("../utils/captureTime");

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
  const {
    unidad_id,
    asociacion_id,
    chofer,
    origen,
    destino,
    pasajeros,
    client_request_id,
    fecha_hora_registro: capturedAt,
  } = req.body;
  const fiscal_id = req.user.id;
  const fecha_hora_registro = resolveCaptureTime(capturedAt);
  try {
    const { registro, duplicate } =
      await fiscalModel.createRegistroFiscalizacion(
        unidad_id,
        fiscal_id,
        asociacion_id,
        chofer,
        origen,
        destino,
        pasajeros,
        fecha_hora_registro,
        { clientRequestId: client_request_id },
      );
    // 200 en un reintento (ya existia), 201 cuando se crea.
    res.status(duplicate ? 200 : 201).json(registro);
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
