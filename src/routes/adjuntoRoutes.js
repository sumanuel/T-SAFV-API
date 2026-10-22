const express = require("express");
const router = express.Router();
const { param, validationResult } = require("express-validator");
const adjuntoController = require("../controllers/adjuntoController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { ENTIDADES_ADJUNTO } = require("../constants/incidencias");
const { maxImageBytes } = require("../utils/imageValidation");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

const entidadParams = [
  param("entidad_tipo")
    .customSanitizer((value) => String(value).toUpperCase())
    .isIn(ENTIDADES_ADJUNTO)
    .withMessage(`entidad_tipo debe ser: ${ENTIDADES_ADJUNTO.join(", ")}`),
  param("entidad_id").isInt({ min: 1 }),
  validate,
];

// Miniaturas de Traza: va antes de las rutas con parametros.
router.get(
  "/resumen/registros",
  authMiddleware,
  adjuntoController.summaryForRegistros,
);

// La foto viaja como cuerpo binario (no base64 en JSON).
router.post(
  "/:entidad_tipo/:entidad_id",
  // El cuerpo se lee ANTES de autenticar: si se respondiera 401 con el cuerpo
  // sin consumir, la conexion se reinicia y el cliente ve un error de red en
  // lugar del 401 (y no renovaria la sesion). El limite de tamano sigue vigente.
  express.raw({ type: ["image/jpeg", "image/png"], limit: maxImageBytes() }),
  authMiddleware,
  ...entidadParams,
  adjuntoController.upload,
);

router.get(
  "/:entidad_tipo/:entidad_id",
  authMiddleware,
  ...entidadParams,
  adjuntoController.listByEntity,
);

router.get(
  "/:id",
  authMiddleware,
  param("id").isInt({ min: 1 }),
  validate,
  adjuntoController.download,
);

module.exports = router;
