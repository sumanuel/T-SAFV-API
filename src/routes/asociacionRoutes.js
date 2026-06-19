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

// Crear una nueva asociación
router.post(
  "/",
  body("nombre")
    .isLength({ min: 3 })
    .withMessage("nombre must be at least 3 chars"),
  body("rif").optional().isString().isLength({ min: 3 }),
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

module.exports = router;
