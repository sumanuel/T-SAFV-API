jest.mock("../../src/config/database", () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock("../../src/middlewares/authMiddleware", () => ({
  authMiddleware: (req, res, next) => {
    req.user = { id: 7 };
    next();
  },
  isFiscal: (req, res, next) => next(),
}));
jest.mock("../../src/models/fiscalModel", () => ({
  createRegistroFiscalizacion: jest.fn(),
  findActiveUnidadesByAsociacion: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const fiscalModel = require("../../src/models/fiscalModel");
const fiscalRoutes = require("../../src/routes/fiscalRoutes");

const app = express();
app.use(express.json());
app.use("/api/fiscal", fiscalRoutes);

const CLIENT_ID = "6f1c4d0e-1a2b-4c3d-8e4f-5a6b7c8d9e0f";
const base = { unidad_id: 3, asociacion_id: 1, chofer: "Pedro", destino: "Caracas", pasajeros: 20 };

beforeEach(() => jest.clearAllMocks());

describe("POST /api/fiscal/registros", () => {
  it("201 al crear y pasa el client_request_id al modelo", async () => {
    fiscalModel.createRegistroFiscalizacion.mockResolvedValue({ registro: { id: 1 }, duplicate: false });

    const res = await request(app)
      .post("/api/fiscal/registros")
      .send({ ...base, client_request_id: CLIENT_ID });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 1 });
    const args = fiscalModel.createRegistroFiscalizacion.mock.calls[0];
    expect(args[1]).toBe(7);
    expect(args[8]).toEqual({ clientRequestId: CLIENT_ID });
  });

  it("200 cuando es un reintento de un registro ya guardado", async () => {
    fiscalModel.createRegistroFiscalizacion.mockResolvedValue({ registro: { id: 1 }, duplicate: true });

    const res = await request(app)
      .post("/api/fiscal/registros")
      .send({ ...base, client_request_id: CLIENT_ID });

    expect(res.statusCode).toBe(200);
  });

  it("usa la hora de captura enviada por la app si es razonable", async () => {
    fiscalModel.createRegistroFiscalizacion.mockResolvedValue({ registro: { id: 1 }, duplicate: false });
    const captured = new Date(Date.now() - 2 * 3600 * 1000).toISOString();

    await request(app).post("/api/fiscal/registros").send({ ...base, fecha_hora_registro: captured });

    expect(fiscalModel.createRegistroFiscalizacion.mock.calls[0][7].toISOString()).toBe(captured);
  });

  it("ignora una hora futura y usa la del servidor", async () => {
    fiscalModel.createRegistroFiscalizacion.mockResolvedValue({ registro: { id: 1 }, duplicate: false });
    const future = new Date(Date.now() + 5 * 3600 * 1000).toISOString();

    await request(app).post("/api/fiscal/registros").send({ ...base, fecha_hora_registro: future });

    const used = fiscalModel.createRegistroFiscalizacion.mock.calls[0][7];
    expect(used.getTime()).toBeLessThanOrEqual(Date.now());
    expect(used.toISOString()).not.toBe(future);
  });

  it("sigue aceptando peticiones sin los campos nuevos (apps anteriores)", async () => {
    fiscalModel.createRegistroFiscalizacion.mockResolvedValue({ registro: { id: 2 }, duplicate: false });

    const res = await request(app).post("/api/fiscal/registros").send(base);

    expect(res.statusCode).toBe(201);
    expect(fiscalModel.createRegistroFiscalizacion.mock.calls[0][8]).toEqual({ clientRequestId: undefined });
  });

  it("400 si client_request_id no es UUID o la fecha no es ISO", async () => {
    const a = await request(app).post("/api/fiscal/registros").send({ ...base, client_request_id: "123" });
    const b = await request(app).post("/api/fiscal/registros").send({ ...base, fecha_hora_registro: "ayer" });

    expect(a.statusCode).toBe(400);
    expect(b.statusCode).toBe(400);
    expect(fiscalModel.createRegistroFiscalizacion).not.toHaveBeenCalled();
  });
});
