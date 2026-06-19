const express = require("express");
const router = express.Router();
const propietarioController = require("../controllers/propietarioController");
const {
  authMiddleware,
  isPropietario,
} = require("../middlewares/authMiddleware");

router.get(
  "/asociaciones/:asociacion_id/unidades",
  authMiddleware,
  isPropietario,
  propietarioController.getMyUnidades,
);
router.get(
  "/unidades/:unidad_id/trazabilidad",
  authMiddleware,
  isPropietario,
  propietarioController.getTrazabilidad,
);

module.exports = router;
