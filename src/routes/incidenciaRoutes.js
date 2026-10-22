const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const incidenciaController = require("../controllers/incidenciaController");
const {
  authMiddleware,
  isAssociationMember,
  isFiscalOrAdmin,
} = require("../middlewares/authMiddleware");
const {
  INCIDENCIA_TIPOS,
  INCIDENCIA_ESTADOS,
} = require("../constants/incidencias");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

// Registrar: fiscales y administradores de la asociacion.
router.post(
  "/",
  authMiddleware,
  body("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  body("tipo")
    .isIn(INCIDENCIA_TIPOS)
    .withMessage(`tipo debe ser uno de: ${INCIDENCIA_TIPOS.join(", ")}`),
  body("descripcion")
    .isString()
    .trim()
    .isLength({ min: 3, max: 4000 })
    .withMessage("descripcion requerida (3 a 4000 caracteres)"),
  body("unidad_id").optional({ values: "falsy" }).isInt(),
  body("registro_id").optional({ values: "falsy" }).isInt(),
  body("lugar").optional({ values: "falsy" }).isString().isLength({ max: 255 }),
  body("fecha_hora_evento").optional().isISO8601(),
  body("client_request_id").optional().isUUID(),
  validate,
  isFiscalOrAdmin,
  incidenciaController.create,
);

// Listado de una asociacion (el propietario solo ve las de sus unidades).
router.get(
  "/asociaciones/:asociacion_id",
  authMiddleware,
  param("asociacion_id").isInt(),
  query("estado").optional().isIn(INCIDENCIA_ESTADOS),
  query("tipo").optional().isIn(INCIDENCIA_TIPOS),
  query("unidad_id").optional().isInt(),
  query("fecha_inicio").optional().isISO8601(),
  query("fecha_fin").optional().isISO8601(),
  query("limit").optional().isInt({ min: 1, max: 200 }),
  query("offset").optional().isInt({ min: 0 }),
  validate,
  isAssociationMember,
  incidenciaController.listByAssociation,
);

router.get(
  "/:id",
  authMiddleware,
  param("id").isInt(),
  validate,
  incidenciaController.getOne,
);

// Cambiar el estado: solo administradores.
router.patch(
  "/:id/estado",
  authMiddleware,
  param("id").isInt(),
  body("estado")
    .isIn(INCIDENCIA_ESTADOS)
    .withMessage(`estado debe ser uno de: ${INCIDENCIA_ESTADOS.join(", ")}`),
  validate,
  incidenciaController.updateEstado,
);

module.exports = router;
