const express = require("express");
const router = express.Router();
const asociacionController = require("../controllers/asociacionController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Se requiere autenticación para todas las rutas de asociaciones
router.use(authMiddleware);

// Crear una nueva asociación
router.post("/", asociacionController.create);

module.exports = router;
