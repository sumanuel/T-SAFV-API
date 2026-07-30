const pool = require("../../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * POST /api/auth/reset-password
 * Actualiza contraseña con resetToken
 */
async function resetPassword(req, res) {
  try {
    const { resetToken, newPassword } = req.body;

    // Verificar JWT
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Token inválido o expirado",
      });
    }

    const userId = decoded.userId;

    // Buscar código verificado asociado al resetToken
    const resetCode = await pool.query(
      `SELECT * FROM password_reset_codes 
       WHERE user_id = $1 
       AND reset_token = $2 
       AND is_verified = TRUE 
       AND used_at IS NULL`,
      [userId, resetToken],
    );

    if (resetCode.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Token inválido o ya usado",
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await pool.query(
      `UPDATE usuarios 
       SET password = $1 
       WHERE id = $2`,
      [hashedPassword, userId],
    );

    // Marcar código como usado e invalidar todos los códigos del usuario
    await pool.query(
      `UPDATE password_reset_codes 
       SET used_at = NOW() 
       WHERE user_id = $1`,
      [userId],
    );

    res.status(200).json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({
      success: false,
      error: "Error al restablecer contraseña",
    });
  }
}

module.exports = { resetPassword };
