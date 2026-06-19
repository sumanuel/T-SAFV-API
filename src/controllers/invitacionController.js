const invitacionModel = require("../models/invitacionModel");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

    // Enviar email con el token de invitación
    const appUrl = process.env.APP_URL || "http://localhost:19006";
    const acceptUrl = `${appUrl}/invitacion/aceptar?token=${invitacion.token_invitacion}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email_invitado,
      subject: `Invitación para unirse a la asociación ${asociacion_id}`,
      text: `Has sido invitado a unirte a la asociación. Usa este enlace para aceptar: ${acceptUrl}`,
      html: `<p>Has sido invitado a unirte a la asociación.</p><p>Haz clic <a href="${acceptUrl}">aquí</a> para aceptar la invitación.</p>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.error("Error sending invitation email:", err);
      else console.log("Invitation email sent:", info.response);
    });

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
