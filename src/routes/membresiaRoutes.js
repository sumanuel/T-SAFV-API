const express = require("express");
const router = express.Router();
const membresiaController = require("../controllers/membresiaController");
const {
  authMiddleware,
  isAsociacionAdmin,
} = require("../middlewares/authMiddleware");

// Cambiar estado de membresía (solo admin de la asociación)
router.post(
  "/asociaciones/:asociacion_id/membresias/:membresia_id/state",
  authMiddleware,
  isAsociacionAdmin,
  membresiaController.changeState,
);

module.exports = router;
