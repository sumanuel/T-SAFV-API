const invitacionModel = require("../models/invitacionModel");

const create = async (req, res) => {
  const { asociacion_id, email_invitado, rol_invitado } = req.body;
  const creadorId = req.user.id;
  if (!["ADMIN", "FISCAL", "PROPIETARIO"].includes(rol_invitado))
    return res.status(400).json({ message: "Invalid role" });
  try {
    const invitacion = await invitacionModel.createInvitacion(
      asociacion_id,
      email_invitado,
      rol_invitado,
      creadorId,
    );
    // TODO: enviar email real. Por ahora, devolver token en la respuesta (o loggear)
    console.log("Invitation token:", invitacion.token_invitacion);
    res.status(201).json(invitacion);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating invitation", error: error.message });
  }
};

const listMy = async (req, res) => {
  const email = req.user && req.user.email;
  try {
    const rows = await invitacionModel.findPendingByEmail(email);
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listing invitations", error: error.message });
  }
};

const respond = async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;
  try {
    const result = await invitacionModel.acceptInvitation(token, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  create,
  listMy,
  respond,
};
