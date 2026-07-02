const { Expo } = require("expo-server-sdk");

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

module.exports = { sendPushNotification };
