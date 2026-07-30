const pool = require("../../config/database");
const userModel = require("../../models/userModel");
const jwt = require("jsonwebtoken");

/**
 * POST /api/auth/verify-reset-code
 * Verifica código de 6 dígitos y devuelve resetToken
 */
async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;

    // Buscar usuario
    const user = await userModel.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Buscar código más reciente no usado
    const resetCode = await pool.query(
      `SELECT * FROM password_reset_codes 
       WHERE user_id = $1 
       AND used_at IS NULL 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [user.id],
    );

    if (resetCode.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No hay código pendiente. Solicita uno nuevo",
      });
    }

    const resetRecord = resetCode.rows[0];

    // Verificar intentos
    if (resetRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        error:
          "Demasiados intentos. Espera 30 minutos y solicita un nuevo código",
      });
    }

    // Incrementar intentos
    await pool.query(
      `UPDATE password_reset_codes 
       SET attempts = attempts + 1 
       WHERE id = $1`,
      [resetRecord.id],
    );

    // Verificar expiración
    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.status(410).json({
        success: false,
        error: "Código expirado. Solicita uno nuevo",
      });
    }

    // Verificar código
    if (resetRecord.code !== code) {
      return res.status(400).json({
        success: false,
        error: "Código incorrecto",
      });
    }

    // Generar resetToken (JWT válido 15 minutos)
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Actualizar registro: marcar como verificado
    await pool.query(
      `UPDATE password_reset_codes 
       SET is_verified = TRUE, reset_token = $1 
       WHERE id = $2`,
      [resetToken, resetRecord.id],
    );

    res.status(200).json({
      success: true,
      resetToken,
    });
  } catch (error) {
    console.error("Error en verifyResetCode:", error);
    res.status(500).json({
      success: false,
      error: "Error al verificar código",
    });
  }
}

module.exports = { verifyResetCode };
