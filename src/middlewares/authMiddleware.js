const jwt = require("jsonwebtoken");
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

// Middleware para verificar roles (ejemplo para administradores)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.rol === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admins only" });
  }
};

module.exports = {
  authMiddleware,
  isAdmin,
};
