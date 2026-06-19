const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
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
  body("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  body("email_invitado")
    .isEmail()
    .withMessage("email_invitado must be a valid email"),
  body("rol_invitado")
    .isIn(["ADMIN", "FISCAL", "PROPIETARIO"])
    .withMessage("Invalid role"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  invitacionController.create,
);

// Listar invitaciones pendientes para el usuario autenticado
router.get("/mine", authMiddleware, invitacionController.listMy);

// Responder (aceptar) invitación
router.post("/respond", authMiddleware, invitacionController.respond);

module.exports = router;
