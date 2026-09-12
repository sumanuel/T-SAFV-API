const express = require("express");
const router = express.Router();
const notificacionController = require("../controllers/notificacionController");
const { param, validationResult } = require("express-validator");
const { authMiddleware } = require("../middlewares/authMiddleware");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.get("/mine", authMiddleware, notificacionController.getMine);

router.patch(
  "/:notificacion_id/leida",
  authMiddleware,
  param("notificacion_id").isInt().withMessage("notificacion_id must be integer"),
  validate,
  notificacionController.markRead,
);

router.patch("/leidas", authMiddleware, notificacionController.markAllRead);

module.exports = router;
