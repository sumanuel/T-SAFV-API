const express = require("express");
const router = express.Router();
const unidadController = require("../controllers/unidadController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

// Todas las rutas de unidades requieren autenticación
router.use(authMiddleware);

// Crear una nueva unidad (solo admins)
router.post("/", isAdmin, unidadController.create);

// Cambiar el estado de una unidad (solo admins)
router.post("/:unidad_id/state", isAdmin, unidadController.changeState);

module.exports = router;
