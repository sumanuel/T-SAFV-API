const MAX_OFFLINE_AGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Hora en la que el fiscal realmente hizo el registro (puede ser anterior a
// la de recepcion si estuvo sin conexion). Se descarta si es invalida, futura
// (reloj del telefono adelantado) o demasiado antigua: en esos casos se usa la
// hora del servidor.
const resolveCaptureTime = (input, now = new Date()) => {
  if (!input) return now;
  const captured = new Date(input);
  if (Number.isNaN(captured.getTime())) return now;
  if (captured.getTime() > now.getTime()) return now;
  if (now.getTime() - captured.getTime() > MAX_OFFLINE_AGE_DAYS * DAY_MS) {
    return now;
  }
  return captured;
};

module.exports = { resolveCaptureTime, MAX_OFFLINE_AGE_DAYS };
