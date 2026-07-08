const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { body, validationResult } = require("express-validator");
const { authMiddleware } = require("../middlewares/authMiddleware");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.post(
  "/register",
  body("nombre").isLength({ min: 2 }).withMessage("nombre too short"),
  body("apellido").optional().isString(),
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("telefono").optional().isString(),
  body("rif_cedula").optional().isString(),
  body("direccion").optional().isString(),
  validate,
  authController.register,
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password required"),
  validate,
  authController.login,
);

router.get(
  "/association-access",
  authMiddleware,
  authController.getAssociationCreationAccessCurrent,
);

// Registrar / actualizar push token del dispositivo
router.patch(
  "/push-token",
  authMiddleware,
  body("push_token").notEmpty().withMessage("push_token requerido"),
  validate,
  authController.updatePushToken,
);

module.exports = router;
