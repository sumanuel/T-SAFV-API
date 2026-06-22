const express = require("express");
const router = express.Router();
const unidadController = require("../controllers/unidadController");
const { body, param, validationResult } = require("express-validator");
const {
  authMiddleware,
  isAdmin,
  isAsociacionAdmin,
} = require("../middlewares/authMiddleware");

// Todas las rutas de unidades requieren autenticación
router.use(authMiddleware);

// Crear una nueva unidad (solo admins)
router.post(
  "/",
  isAdmin,
  body("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  body("propietario_id").isInt().withMessage("propietario_id must be integer"),
  body("placa").isString().notEmpty().withMessage("placa is required"),
  body("numero_unidad")
    .isString()
    .notEmpty()
    .withMessage("numero_unidad is required"),
  body("numero_puestos").isInt().withMessage("numero_puestos must be integer"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  unidadController.create,
);

router.post(
  "/asociaciones/:asociacion_id/unidades",
  isAsociacionAdmin,
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  body("propietario_id").isInt().withMessage("propietario_id must be integer"),
  body("placa").isString().notEmpty().withMessage("placa is required"),
  body("numero_unidad")
    .isString()
    .notEmpty()
    .withMessage("numero_unidad is required"),
  body("numero_puestos").isInt().withMessage("numero_puestos must be integer"),
  (req, res, next) => {
    req.body.asociacion_id = Number(req.params.asociacion_id);
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  unidadController.create,
);

// Cambiar el estado de una unidad (solo admins)
router.post(
  "/:unidad_id/state",
  isAdmin,
  param("unidad_id").isInt().withMessage("unidad_id must be integer"),
  body("estado")
    .isIn(["ACTIVO", "INACTIVO", "SUSPENDIDO"])
    .withMessage("Invalid estado"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  unidadController.changeState,
);

module.exports = router;
