const express = require("express");
const router = express.Router();
const fiscalController = require("../controllers/fiscalController");
const { body, param, validationResult } = require("express-validator");
const { authMiddleware, isFiscal } = require("../middlewares/authMiddleware");

router.get(
  "/asociaciones/:asociacion_id/unidades",
  authMiddleware,
  isFiscal,
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  fiscalController.getUnidadesActivas,
);
router.post(
  "/registros",
  authMiddleware,
  isFiscal,
  body("unidad_id").isInt().withMessage("unidad_id must be integer"),
  body("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  body("chofer").optional().isString(),
  body("destino").optional().isString(),
  body("pasajeros").optional().isInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  fiscalController.createRegistro,
);

module.exports = router;
