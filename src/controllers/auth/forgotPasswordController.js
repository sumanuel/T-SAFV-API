const pool = require("../../config/database");
const userModel = require("../../models/userModel");
const { sendPasswordResetEmail } = require("../../services/emailService");

/**
 * Genera código de 6 dígitos aleatorio
 */
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/forgot-password
 * Envía código de recuperación por email
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Buscar usuario por email
    const user = await userModel.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Email no registrado",
      });
    }

    // Verificar cooldown (1 minuto)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await pool.query(
      `SELECT * FROM password_reset_codes 
       WHERE user_id = $1 
       AND created_at > $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [user.id, oneMinuteAgo],
    );

    if (recentCode.rows.length > 0) {
      return res.status(429).json({
        success: false,
        error: "Espera 1 minuto antes de solicitar nuevo código",
      });
    }

    // Invalidar códigos anteriores
    await pool.query(
      `UPDATE password_reset_codes 
       SET used_at = NOW() 
       WHERE user_id = $1 
       AND used_at IS NULL`,
      [user.id],
    );

    // Generar nuevo código
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Insertar código en BD
    await pool.query(
      `INSERT INTO password_reset_codes 
       (user_id, code, expires_at, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      [user.id, code, expiresAt],
    );

    // Enviar email
    await sendPasswordResetEmail(user.email, code);

    res.status(200).json({
      success: true,
      message: "Código enviado a tu email",
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({
      success: false,
      error: "Error al procesar solicitud",
    });
  }
}

module.exports = { forgotPassword };
