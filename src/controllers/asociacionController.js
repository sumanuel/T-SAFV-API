const asociacionModel = require("../models/asociacionModel");

const create = async (req, res) => {
  const datosAsociacion = req.body;
  const adminId = req.user.id; // ID del usuario autenticado desde el middleware

  try {
    const nuevaAsociacion = await asociacionModel.createAsociacion(
      datosAsociacion,
      adminId,
    );
    res.status(201).json(nuevaAsociacion);
  } catch (error) {
    // Manejo de errores específicos, como RIF duplicado
    if (error.code === "23505" && error.constraint === "asociaciones_rif_key") {
      return res.status(409).json({ message: "El RIF ya está registrado." });
    }
    res
      .status(500)
      .json({ message: "Error creating association", error: error.message });
  }
};

module.exports = {
  create,
};
