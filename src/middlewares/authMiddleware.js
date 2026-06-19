const jwt = require("jsonwebtoken");
const pool = require("../config/database");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Agrega los datos del usuario (ej. id, rol) al request
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware para verificar rol ADMIN global
const isAdmin = (req, res, next) => {
  if (req.user && req.user.rol === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admins only" });
  }
};

// Verifica que el usuario tenga cierto rol en la asociación indicada
const verifyRoleInAssociation = async (usuarioId, asociacionId, role) => {
  const membRes = await pool.query(
    "SELECT id, rol FROM membresias WHERE usuario_id = $1 AND asociacion_id = $2 AND rol = $3 LIMIT 1",
    [usuarioId, asociacionId, role],
  );
  const membresia = membRes.rows[0];
  if (!membresia) return false;
  const histRes = await pool.query(
    `SELECT estado FROM historial_estados WHERE entidad_tipo='MEMBRESIA' AND entidad_id=$1 ORDER BY created_at DESC LIMIT 1`,
    [membresia.id],
  );
  const latest = histRes.rows[0];
  if (latest && latest.estado === "INACTIVO") return false;
  return true;
};

const isAsociacionAdmin = async (req, res, next) => {
  const usuarioId = req.user && req.user.id;
  const asociacionId =
    req.params.asociacion_id ||
    req.body.asociacion_id ||
    req.query.asociacion_id;
  if (!usuarioId || !asociacionId)
    return res.status(400).json({ message: "Missing association or user" });
  try {
    const ok = await verifyRoleInAssociation(usuarioId, asociacionId, "ADMIN");
    if (!ok)
      return res
        .status(403)
        .json({ message: "Forbidden: Admins only for this association" });
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying admin", error: error.message });
  }
};

const isPropietario = async (req, res, next) => {
  const usuarioId = req.user && req.user.id;
  const asociacionId =
    req.params.asociacion_id ||
    req.body.asociacion_id ||
    req.query.asociacion_id;
  if (!usuarioId || !asociacionId)
    return res.status(400).json({ message: "Missing association or user" });
  try {
    const ok = await verifyRoleInAssociation(
      usuarioId,
      asociacionId,
      "PROPIETARIO",
    );
    if (!ok)
      return res.status(403).json({ message: "Forbidden: Propietarios only" });
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying propietario", error: error.message });
  }
};

const isFiscal = async (req, res, next) => {
  const usuarioId = req.user && req.user.id;
  const asociacionId =
    req.params.asociacion_id ||
    req.body.asociacion_id ||
    req.query.asociacion_id;
  if (!usuarioId || !asociacionId)
    return res.status(400).json({ message: "Missing association or user" });
  try {
    const ok = await verifyRoleInAssociation(usuarioId, asociacionId, "FISCAL");
    if (!ok)
      return res.status(403).json({ message: "Forbidden: Fiscales only" });
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying fiscal", error: error.message });
  }
};

module.exports = {
  authMiddleware,
  isAdmin,
  isAsociacionAdmin,
  isPropietario,
  isFiscal,
};
