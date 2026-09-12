const notificacionModel = require("../models/notificacionModel");

const getMine = async (req, res) => {
  const usuarioId = req.user.id;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  try {
    const [notificaciones, noLeidas] = await Promise.all([
      notificacionModel.listByUser(usuarioId, { limit }),
      notificacionModel.countUnread(usuarioId),
    ]);
    res.json({ notificaciones, no_leidas: noLeidas });
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo notificaciones",
      error: error.message,
    });
  }
};

const markRead = async (req, res) => {
  const usuarioId = req.user.id;
  const { notificacion_id } = req.params;
  try {
    const updated = await notificacionModel.markAsRead(
      usuarioId,
      notificacion_id,
    );
    if (!updated) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando notificación",
      error: error.message,
    });
  }
};

const markAllRead = async (req, res) => {
  const usuarioId = req.user.id;
  try {
    await notificacionModel.markAllAsRead(usuarioId);
    res.json({ message: "Notificaciones marcadas como leídas" });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando notificaciones",
      error: error.message,
    });
  }
};

module.exports = { getMine, markRead, markAllRead };
