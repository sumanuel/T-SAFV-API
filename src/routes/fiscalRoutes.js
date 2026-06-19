const express = require("express");
const router = express.Router();
const fiscalController = require("../controllers/fiscalController");
const { authMiddleware, isFiscal } = require("../middlewares/authMiddleware");

router.get(
  "/asociaciones/:asociacion_id/unidades",
  authMiddleware,
  isFiscal,
  fiscalController.getUnidadesActivas,
);
router.post(
  "/registros",
  authMiddleware,
  isFiscal,
  fiscalController.createRegistro,
);

module.exports = router;
