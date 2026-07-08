const express = require("express");
const router = express.Router();
const asociacionController = require("../controllers/asociacionController");
const {
  authMiddleware,
  isAssociationMember,
  isAsociacionAdmin,
} = require("../middlewares/authMiddleware");
const { body, param, validationResult } = require("express-validator");

// Se requiere autenticación para todas las rutas de asociaciones
router.use(authMiddleware);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.get("/mine", asociacionController.listMine);

// Incluye asociaciones expiradas para modo solo-lectura (ADMIN)
router.get("/mine-all", asociacionController.listMineAll);
router.post(
  "/",
  body("nombre")
    .isLength({ min: 3 })
    .withMessage("nombre must be at least 3 chars"),
  body("rif").isString().isLength({ min: 3 }),
  body("direccion_fiscal").isString().isLength({ min: 5 }),
  body("email").isEmail().withMessage("Invalid association email"),
  body("telefonos").isString().isLength({ min: 5 }),
  body("logo_url").optional().isString(),
  body("logo_data").optional().isString(),
  body("redes_sociales").optional().isObject(),
  validate,
  asociacionController.create,
);

router.put(
  "/:asociacion_id",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  body("nombre")
    .isLength({ min: 3 })
    .withMessage("nombre must be at least 3 chars"),
  body("rif").optional().isString(),
  validate,
  isAsociacionAdmin,
  asociacionController.update,
);

router.get(
  "/:asociacion_id/miembros",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  validate,
  isAssociationMember,
  asociacionController.listMembers,
);

router.get(
  "/:asociacion_id/miembros/:membresia_id",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  param("membresia_id").isInt().withMessage("membresia_id must be integer"),
  validate,
  isAssociationMember,
  asociacionController.getMemberDetail,
);

router.post(
  "/:asociacion_id/miembros",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  body("nombre").isLength({ min: 2 }).withMessage("nombre too short"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("punto_control").optional().isString(),
  body("estado_invitacion")
    .optional()
    .isIn(["PENDIENTE_INVITACION", "INVITACION_ENVIADA", "ACEPTADA"])
    .withMessage("Invalid invitation state"),
  body("rol").isIn(["PROPIETARIO", "FISCAL"]).withMessage("Invalid role"),
  validate,
  isAsociacionAdmin,
  asociacionController.createMember,
);

router.put(
  "/:asociacion_id/miembros/:membresia_id",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  param("membresia_id").isInt().withMessage("membresia_id must be integer"),
  body("nombre").isLength({ min: 2 }).withMessage("nombre too short"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("punto_control").optional().isString(),
  body("estado_invitacion")
    .optional()
    .isIn(["PENDIENTE_INVITACION", "INVITACION_ENVIADA", "ACEPTADA"])
    .withMessage("Invalid invitation state"),
  body("rol").isIn(["PROPIETARIO", "FISCAL"]).withMessage("Invalid role"),
  validate,
  isAsociacionAdmin,
  asociacionController.updateMember,
);

router.delete(
  "/:asociacion_id/miembros/:membresia_id",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  param("membresia_id").isInt().withMessage("membresia_id must be integer"),
  validate,
  isAsociacionAdmin,
  asociacionController.deleteMember,
);

router.get(
  "/:asociacion_id/unidades",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  validate,
  isAssociationMember,
  asociacionController.listUnits,
);

router.get(
  "/:asociacion_id/trazabilidad",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  validate,
  isAssociationMember,
  asociacionController.listTraceability,
);

router.get(
  "/:asociacion_id/pagos",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  validate,
  isAsociacionAdmin,
  asociacionController.listPayments,
);

router.post(
  "/:asociacion_id/pagos",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  body("fecha_desde")
    .isString()
    .notEmpty()
    .withMessage("fecha_desde is required"),
  body("fecha_hasta")
    .isString()
    .notEmpty()
    .withMessage("fecha_hasta is required"),
  validate,
  isAsociacionAdmin,
  asociacionController.createPayment,
);

// Activar período de prueba de 7 días (solo ADMIN de la asociación, una sola vez)
router.post(
  "/:asociacion_id/trial",
  param("asociacion_id").isInt().withMessage("asociacion_id must be integer"),
  validate,
  isAsociacionAdmin,
  asociacionController.activateTrial,
);

module.exports = router;
