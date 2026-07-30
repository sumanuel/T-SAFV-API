const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");

// Configuración del transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía email de recuperación de contraseña con código
 * @param {string} to - Email del destinatario
 * @param {string} code - Código de 6 dígitos
 */
async function sendPasswordResetEmail(to, code) {
  try {
    // Leer template HTML
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "emails",
      "reset-password.html",
    );
    let htmlTemplate = await fs.readFile(templatePath, "utf-8");

    // Reemplazar placeholder del código
    htmlTemplate = htmlTemplate.replace("{{CODE}}", code);

    const mailOptions = {
      from: process.env.EMAIL_FROM || "T-SAFV <noreply@t-safv.com>",
      to,
      subject: "Código de recuperación - T-SAFV",
      html: htmlTemplate,
      text: `Tu código de recuperación es: ${code}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este código, ignora este mensaje.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar email:", error);
    throw new Error("No se pudo enviar el email");
  }
}

module.exports = {
  sendPasswordResetEmail,
};
