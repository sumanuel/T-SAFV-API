const express = require("express");
const router = express.Router();
const asociacionController = require("../controllers/asociacionController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { body, validationResult } = require("express-validator");

// Se requiere autenticación para todas las rutas de asociaciones
router.use(authMiddleware);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

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

module.exports = router;
