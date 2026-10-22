let mockCurrentUser = { id: 7 };
const mockPass = (req, res, next) => next();
jest.mock("../../src/config/database", () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock("../../src/middlewares/authMiddleware", () => ({
  authMiddleware: (req, res, next) => {
    req.user = mockCurrentUser;
    next();
  },
  isFiscalOrAdmin: (req, res, next) => mockPass(req, res, next),
  isAssociationMember: (req, res, next) => mockPass(req, res, next),
  verifyMembershipInAssociation: jest.fn(),
}));
jest.mock("../../src/models/incidenciaModel", () => ({
  unidadPerteneceAAsociacion: jest.fn(),
  registroPerteneceAAsociacion: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  updateEstado: jest.fn(),
}));
jest.mock("../../src/models/adjuntoModel", () => ({ listByEntities: jest.fn() }));
jest.mock("../../src/services/notificationService", () => ({ notifyUser: jest.fn() }));

const express = require("express");
const request = require("supertest");
const {
  verifyMembershipInAssociation,
} = require("../../src/middlewares/authMiddleware");
const incidenciaModel = require("../../src/models/incidenciaModel");
const adjuntoModel = require("../../src/models/adjuntoModel");
const { notifyUser } = require("../../src/services/notificationService");
const incidenciaRoutes = require("../../src/routes/incidenciaRoutes");

const app = express();
app.use(express.json());
app.use("/api/incidencias", incidenciaRoutes);

const asRole = (...roles) =>
  verifyMembershipInAssociation.mockImplementation(
    async (_u, _a, role) => roles.includes(role),
  );

const CLIENT_ID = "6f1c4d0e-1a2b-4c3d-8e4f-5a6b7c8d9e0f";
const valid = {
  asociacion_id: 1,
  tipo: "INFRACCION",
  descripcion: "Exceso de pasajeros",
  unidad_id: 3,
};
const created = { id: 21, asociacion_id: 1, unidad_id: 3, tipo: "INFRACCION", estado: "ABIERTA" };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockCurrentUser = { id: 7 };
  incidenciaModel.unidadPerteneceAAsociacion.mockResolvedValue(true);
  incidenciaModel.registroPerteneceAAsociacion.mockResolvedValue(true);
  incidenciaModel.create.mockResolvedValue({ incidencia: created, duplicate: false });
  incidenciaModel.findById.mockResolvedValue({
    ...created,
    propietario_id: 9,
    numero_unidad: "010",
  });
  adjuntoModel.listByEntities.mockResolvedValue([]);
  asRole("ADMIN");
});
afterEach(() => console.error.mockRestore());

describe("POST /api/incidencias", () => {
  it("201 al registrar, y avisa al propietario de la unidad", async () => {
    const res = await request(app).post("/api/incidencias").send(valid);

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(21);
    const args = incidenciaModel.create.mock.calls[0][0];
    expect(args).toMatchObject({
      asociacionId: 1,
      unidadId: 3,
      tipo: "INFRACCION",
      descripcion: "Exceso de pasajeros",
      reportadaPor: 7,
    });
    expect(args.fechaHoraEvento).toBeInstanceOf(Date);
    expect(notifyUser).toHaveBeenCalledTimes(1);
    expect(notifyUser.mock.calls[0][0]).toBe(9);
    expect(notifyUser.mock.calls[0][1]).toMatchObject({ tipo: "incidencia" });
  });

  it("un reintento (mismo client_request_id) responde 200 y NO vuelve a notificar", async () => {
    incidenciaModel.create.mockResolvedValue({ incidencia: created, duplicate: true });

    const res = await request(app)
      .post("/api/incidencias")
      .send({ ...valid, client_request_id: CLIENT_ID });

    expect(res.statusCode).toBe(200);
    expect(notifyUser).not.toHaveBeenCalled();
    expect(incidenciaModel.create.mock.calls[0][0].clientRequestId).toBe(CLIENT_ID);
  });

  it("sin unidad es un evento general: se guarda y no se notifica a nadie", async () => {
    incidenciaModel.create.mockResolvedValue({
      incidencia: { ...created, unidad_id: null },
      duplicate: false,
    });

    const res = await request(app)
      .post("/api/incidencias")
      .send({ asociacion_id: 1, tipo: "OTRO", descripcion: "Bloqueo en la via" });

    expect(res.statusCode).toBe(201);
    expect(incidenciaModel.unidadPerteneceAAsociacion).not.toHaveBeenCalled();
    expect(notifyUser).not.toHaveBeenCalled();
  });

  it("un fallo al notificar no impide guardar la incidencia", async () => {
    notifyUser.mockRejectedValue(new Error("push caido"));
    expect((await request(app).post("/api/incidencias").send(valid)).statusCode).toBe(201);
  });

  it("respeta la hora del evento enviada y descarta una futura", async () => {
    const past = new Date(Date.now() - 3600 * 1000).toISOString();
    await request(app).post("/api/incidencias").send({ ...valid, fecha_hora_evento: past });
    expect(incidenciaModel.create.mock.calls[0][0].fechaHoraEvento.toISOString()).toBe(past);

    const future = new Date(Date.now() + 7200 * 1000).toISOString();
    await request(app).post("/api/incidencias").send({ ...valid, fecha_hora_evento: future });
    expect(incidenciaModel.create.mock.calls[1][0].fechaHoraEvento.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("400 si la unidad o la fiscalizacion son de otra asociacion", async () => {
    incidenciaModel.unidadPerteneceAAsociacion.mockResolvedValue(false);
    expect((await request(app).post("/api/incidencias").send(valid)).statusCode).toBe(400);

    incidenciaModel.unidadPerteneceAAsociacion.mockResolvedValue(true);
    incidenciaModel.registroPerteneceAAsociacion.mockResolvedValue(false);
    expect(
      (await request(app).post("/api/incidencias").send({ ...valid, registro_id: 5 })).statusCode,
    ).toBe(400);
    expect(incidenciaModel.create).not.toHaveBeenCalled();
  });

  it.each([
    ["tipo desconocido", { tipo: "ROBO" }],
    ["descripcion vacia", { descripcion: "  " }],
    ["descripcion muy larga", { descripcion: "x".repeat(4001) }],
    ["client_request_id invalido", { client_request_id: "123" }],
    ["fecha invalida", { fecha_hora_evento: "ayer" }],
    ["asociacion invalida", { asociacion_id: "abc" }],
  ])("400: %s", async (_label, override) => {
    const res = await request(app).post("/api/incidencias").send({ ...valid, ...override });
    expect(res.statusCode).toBe(400);
    expect(incidenciaModel.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/incidencias/asociaciones/:id", () => {
  it("administradores y fiscales ven todas, con filtros y sus fotos", async () => {
    incidenciaModel.list.mockResolvedValue([{ id: 21 }, { id: 22 }]);
    adjuntoModel.listByEntities.mockResolvedValue([{ id: 99, entidad_id: 21 }]);

    const res = await request(app).get(
      "/api/incidencias/asociaciones/1?estado=ABIERTA&tipo=INFRACCION&unidad_id=3&limit=500",
    );

    expect(res.statusCode).toBe(400);

    const ok = await request(app).get(
      "/api/incidencias/asociaciones/1?estado=ABIERTA&tipo=INFRACCION&unidad_id=3&limit=50",
    );
    expect(ok.statusCode).toBe(200);
    expect(incidenciaModel.list.mock.calls[0][0]).toMatchObject({
      asociacionId: 1,
      propietarioId: undefined,
      estado: "ABIERTA",
      tipo: "INFRACCION",
      unidadId: 3,
      limit: 50,
    });
    expect(ok.body[0].adjuntos).toEqual([{ id: 99, entidad_id: 21 }]);
    expect(ok.body[1].adjuntos).toEqual([]);
  });

  it("el propietario solo recibe las de sus unidades", async () => {
    asRole("PROPIETARIO");
    mockCurrentUser = { id: 9 };
    incidenciaModel.list.mockResolvedValue([]);

    await request(app).get("/api/incidencias/asociaciones/1");

    expect(incidenciaModel.list.mock.calls[0][0].propietarioId).toBe(9);
  });

  it("403 si no es miembro activo", async () => {
    asRole();
    expect((await request(app).get("/api/incidencias/asociaciones/1")).statusCode).toBe(403);
  });

  it("si la tabla de fotos aun no existe, igual lista las incidencias", async () => {
    incidenciaModel.list.mockResolvedValue([{ id: 21 }]);
    adjuntoModel.listByEntities.mockRejectedValue(new Error('relation "adjuntos" does not exist'));

    const res = await request(app).get("/api/incidencias/asociaciones/1");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 21, adjuntos: [] }]);
  });
});

describe("GET /api/incidencias/:id", () => {
  it("200 para quien puede verla", async () => {
    const res = await request(app).get("/api/incidencias/21");
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(21);
  });

  it("el propietario solo ve la de su unidad", async () => {
    asRole("PROPIETARIO");
    mockCurrentUser = { id: 9 };
    expect((await request(app).get("/api/incidencias/21")).statusCode).toBe(200);

    mockCurrentUser = { id: 10 };
    expect((await request(app).get("/api/incidencias/21")).statusCode).toBe(403);
  });

  it("404 si no existe y 403 si no es miembro", async () => {
    incidenciaModel.findById.mockResolvedValue(null);
    expect((await request(app).get("/api/incidencias/21")).statusCode).toBe(404);

    incidenciaModel.findById.mockResolvedValue({ ...created, propietario_id: 9 });
    asRole();
    expect((await request(app).get("/api/incidencias/21")).statusCode).toBe(403);
  });
});

describe("PATCH /api/incidencias/:id/estado", () => {
  it("solo un administrador cambia el estado", async () => {
    incidenciaModel.updateEstado.mockResolvedValue({ ...created, estado: "CERRADA" });

    const ok = await request(app).patch("/api/incidencias/21/estado").send({ estado: "CERRADA" });
    expect(ok.statusCode).toBe(200);
    expect(incidenciaModel.updateEstado).toHaveBeenCalledWith(21, "CERRADA", 7);

    asRole("FISCAL");
    const denied = await request(app).patch("/api/incidencias/21/estado").send({ estado: "CERRADA" });
    expect(denied.statusCode).toBe(403);
    expect(incidenciaModel.updateEstado).toHaveBeenCalledTimes(1);
  });

  it("400 con un estado invalido y 404 si no existe", async () => {
    expect(
      (await request(app).patch("/api/incidencias/21/estado").send({ estado: "BORRADA" })).statusCode,
    ).toBe(400);

    incidenciaModel.findById.mockResolvedValue(null);
    expect(
      (await request(app).patch("/api/incidencias/21/estado").send({ estado: "CERRADA" })).statusCode,
    ).toBe(404);
  });
});
