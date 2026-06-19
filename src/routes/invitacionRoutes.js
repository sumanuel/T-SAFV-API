const express = require("express");
const router = express.Router();
const invitacionController = require("../controllers/invitacionController");
const {
  authMiddleware,
  isAsociacionAdmin,
} = require("../middlewares/authMiddleware");

// Crear invitación (solo admin de la asociación)
router.post(
  "/",
  authMiddleware,
  isAsociacionAdmin,
  invitacionController.create,
);

// Listar invitaciones pendientes para el usuario autenticado
router.get("/mine", authMiddleware, invitacionController.listMy);

// Responder (aceptar) invitación
router.post("/respond", authMiddleware, invitacionController.respond);

module.exports = router;
