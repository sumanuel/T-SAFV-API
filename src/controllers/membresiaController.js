const membresiaModel = require("../models/membresiaModel");

const changeState = async (req, res) => {
  const { asociacion_id, membresia_id } = req.params;
  const { estado, motivo } = req.body;
  const userId = req.user.id;

  if (!estado) return res.status(400).json({ message: "Estado requerido" });

  try {
    // opcional: validar que la membresia pertenezca a la asociación
    const memb = await membresiaModel.getMembresiaById(membresia_id);
    if (!memb)
      return res.status(404).json({ message: "Membresía no encontrada" });
    if (String(memb.asociacion_id) !== String(asociacion_id))
      return res
        .status(400)
        .json({ message: "Membresía no pertenece a la asociación indicada" });

    const entry = await membresiaModel.changeMembresiaState(
      membresia_id,
      estado,
      motivo || null,
      userId,
    );
    res.json(entry);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error cambiando estado de membresía",
        error: error.message,
      });
  }
};

module.exports = {
  changeState,
};
