const { resolveCaptureTime } = require("../../src/utils/captureTime");

const NOW = new Date("2026-10-18T12:00:00Z");
const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

describe("resolveCaptureTime", () => {
  it("sin valor usa la hora del servidor", () => {
    expect(resolveCaptureTime(undefined, NOW)).toBe(NOW);
    expect(resolveCaptureTime("", NOW)).toBe(NOW);
  });

  it("respeta la hora real de captura de un registro hecho sin conexion", () => {
    expect(resolveCaptureTime(ago(3 * HOUR), NOW).toISOString()).toBe(ago(3 * HOUR));
  });

  it("acepta registros de hasta 30 dias", () => {
    expect(resolveCaptureTime(ago(29 * DAY), NOW).toISOString()).toBe(ago(29 * DAY));
  });

  it("descarta fechas invalidas, futuras o demasiado antiguas", () => {
    expect(resolveCaptureTime("no-es-fecha", NOW)).toBe(NOW);
    expect(resolveCaptureTime(new Date(NOW.getTime() + HOUR).toISOString(), NOW)).toBe(NOW);
    expect(resolveCaptureTime(ago(31 * DAY), NOW)).toBe(NOW);
  });
});
