const express = require("express");
const router = express.Router();
const membresiaController = require("../controllers/membresiaController");
const { body, param, validationResult } = require("express-validator");
const {
  authMiddleware,
  isAsociacionAdmin,
} = require("../middlewares/authMiddleware");

// Cambiar estado de membresía (solo admin de la asociación)
router.post(
  "/asociaciones/:asociacion_id/membresias/:membresia_id/state",
  authMiddleware,
  isAsociacionAdmin,
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  param("membresia_id").isInt().withMessage("membresia_id must be integer"),
  body("estado")
    .isIn(["ACTIVO", "INACTIVO", "SUSPENDIDO"])
    .withMessage("Invalid estado"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  membresiaController.changeState,
);

module.exports = router;
