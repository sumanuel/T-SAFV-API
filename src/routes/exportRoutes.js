const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const {
  authMiddleware,
  isAsociacionAdmin,
} = require("../middlewares/authMiddleware");

router.get(
  "/asociaciones/:asociacion_id/miembros",
  authMiddleware,
  isAsociacionAdmin,
  exportController.exportMiembros,
);
router.get(
  "/asociaciones/:asociacion_id/unidades",
  authMiddleware,
  isAsociacionAdmin,
  exportController.exportUnidades,
);
router.get(
  "/asociaciones/:asociacion_id/trazabilidad",
  authMiddleware,
  isAsociacionAdmin,
  exportController.exportTrazabilidad,
);

module.exports = router;
