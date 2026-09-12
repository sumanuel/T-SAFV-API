const { Expo } = require("expo-server-sdk");
const pool = require("../config/database");
const notificacionModel = require("../models/notificacionModel");

const expo = new Expo();

/**
 * Envía una notificación push a un token de dispositivo Expo.
 * @param {string} pushToken - Token Expo del dispositivo destino.
 * @param {string} title - Título de la notificación.
 * @param {string} body - Cuerpo del mensaje.
 * @param {object} [data] - Datos adicionales opcionales.
 */
async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
    return;
  }

  const messages = [
    {
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    console.error("Error enviando push notification:", error.message);
  }
}

/**
 * Notifica a un usuario: guarda la notificación (para la campana de la app)
 * y, si el usuario tiene push_token registrado, también le envía la push.
 * @param {number} usuarioId
 * @param {{tipo?: string, title: string, body: string, data?: object}} notification
 */
async function notifyUser(usuarioId, { tipo = "general", title, body, data = {} }) {
  try {
    await notificacionModel.createNotification(usuarioId, {
      tipo,
      titulo: title,
      cuerpo: body,
      data,
    });
  } catch (error) {
    console.error("Error guardando notificación:", error.message);
  }

  try {
    const userRes = await pool.query(
      "SELECT push_token FROM usuarios WHERE id = $1 LIMIT 1",
      [usuarioId],
    );
    const pushToken = userRes.rows[0]?.push_token;
    if (pushToken) {
      await sendPushNotification(pushToken, title, body, data);
    }
  } catch (error) {
    console.error("Error enviando push notification:", error.message);
  }
}

module.exports = { sendPushNotification, notifyUser };
