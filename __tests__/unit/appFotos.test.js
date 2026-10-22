process.env.JWT_SECRET = "test-secret";

jest.mock("../../src/config/database", () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock("nodemailer");

const jwt = require("jsonwebtoken");
const request = require("supertest");
const pool = require("../../src/config/database");
const app = require("../../index");

const token = (id) => jwt.sign({ id, rol: "ADMIN" }, process.env.JWT_SECRET, { expiresIn: "1h" });

// JPEG de ~1 MB: comprueba que el cuerpo binario atraviesa helmet, el limite
// JSON, sanitize y el parser binario sin corromperse.
const BIG_JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]),
  Buffer.from(Array.from({ length: 1024 * 1024 }, (_, i) => i % 251)),
]);

let stored;

beforeEach(() => {
  jest.clearAllMocks();
  stored = null;
  pool.query.mockImplementation(async (sql, params) => {
    const text = String(sql);
    if (/FROM membresias/.test(text) && /LIMIT 1/.test(text)) {
      return { rows: params[2] === "ADMIN" ? [{ id: 1, rol: "ADMIN" }] : [] };
    }
    if (/historial_estados/.test(text)) return { rows: [] };
    if (/FROM registros_fiscalizacion rf/.test(text)) {
      return { rows: [{ id: 11, asociacion_id: 1, creador_id: 3, propietario_id: 9 }] };
    }
    if (/COUNT\(\*\)/.test(text)) return { rows: [{ n: 0 }] };
    if (/INSERT INTO adjuntos/.test(text)) {
      stored = params[5];
      return {
        rows: [{ id: 50, entidad_tipo: params[0], entidad_id: params[1], mime: params[2], bytes: params[3] }],
      };
    }
    return { rows: [] };
  });
});

describe("app completa: foto de 1 MB", () => {
  it("se guarda intacta (byte a byte) y responde 201", async () => {
    const res = await request(app)
      .post("/api/adjuntos/REGISTRO/11")
      .set("Authorization", `Bearer ${token(3)}`)
      .set("Content-Type", "image/jpeg")
      .send(BIG_JPEG);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ id: 50, mime: "image/jpeg", bytes: BIG_JPEG.length });
    expect(Buffer.compare(stored, BIG_JPEG)).toBe(0);
  });

  it("sin token responde 401 y no toca la base", async () => {
    const res = await request(app)
      .post("/api/adjuntos/REGISTRO/11")
      .set("Content-Type", "image/jpeg")
      .send(BIG_JPEG);

    expect(res.statusCode).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("una imagen de mas de 3 MB se rechaza con 413", async () => {
    const huge = Buffer.concat([BIG_JPEG, BIG_JPEG, BIG_JPEG, BIG_JPEG]);

    const res = await request(app)
      .post("/api/adjuntos/REGISTRO/11")
      .set("Authorization", `Bearer ${token(3)}`)
      .set("Content-Type", "image/jpeg")
      .send(huge);

    expect(res.statusCode).toBe(413);
  });

  it("las rutas de incidencias estan montadas y exigen autenticacion", async () => {
    expect((await request(app).get("/api/incidencias/asociaciones/1")).statusCode).toBe(401);
    expect((await request(app).post("/api/incidencias").send({})).statusCode).toBe(401);
  });
});
