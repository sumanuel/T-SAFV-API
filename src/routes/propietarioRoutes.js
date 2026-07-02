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

// Cross-asociación: todas mis unidades en todas mis asociaciones activas
router.get(
  "/mis-unidades",
  authMiddleware,
  propietarioController.getMyUnidadesAll,
);

// Cross-asociación: toda mi trazabilidad en mis asociaciones activas
router.get(
  "/mi-trazabilidad",
  authMiddleware,
  propietarioController.getMyTrazabilidadAll,
);

module.exports = router;
