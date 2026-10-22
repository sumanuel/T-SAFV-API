process.env.ADJUNTO_MAX_BYTES = "2000";

let mockCurrentUser = { id: 7 };
jest.mock("../../src/config/database", () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock("../../src/middlewares/authMiddleware", () => ({
  authMiddleware: (req, res, next) => {
    req.user = mockCurrentUser;
    next();
  },
  verifyMembershipInAssociation: jest.fn(),
}));
jest.mock("../../src/models/adjuntoModel", () => ({
  create: jest.fn(),
  findContent: jest.fn(),
  listByEntities: jest.fn(),
  countByEntity: jest.fn(),
  findEntityContext: jest.fn(),
  summaryForRegistros: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const {
  verifyMembershipInAssociation,
} = require("../../src/middlewares/authMiddleware");
const adjuntoModel = require("../../src/models/adjuntoModel");
const adjuntoRoutes = require("../../src/routes/adjuntoRoutes");
const errorHandler = require("../../src/middlewares/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/adjuntos", adjuntoRoutes);
app.use(errorHandler);

const JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]),
  Buffer.alloc(200, 1),
]);

const asRole = (...roles) =>
  verifyMembershipInAssociation.mockImplementation(
    async (_u, _a, role) => roles.includes(role),
  );
const entity = { id: 11, asociacion_id: 1, creador_id: 7, propietario_id: 9 };

const upload = (path = "/api/adjuntos/REGISTRO/11", body = JPEG, type = "image/jpeg") =>
  request(app).post(path).set("Content-Type", type).send(body);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockCurrentUser = { id: 7 };
  adjuntoModel.findEntityContext.mockResolvedValue(entity);
  adjuntoModel.countByEntity.mockResolvedValue(0);
  adjuntoModel.create.mockResolvedValue({
    id: 99,
    entidad_tipo: "REGISTRO",
    entidad_id: 11,
    mime: "image/jpeg",
    bytes: JPEG.length,
  });
  asRole("FISCAL");
});
afterEach(() => console.error.mockRestore());

describe("POST /api/adjuntos/:tipo/:id", () => {
  it("201: el fiscal que creo la fiscalizacion sube su foto", async () => {
    const res = await upload();

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ id: 99, mime: "image/jpeg" });
    const saved = adjuntoModel.create.mock.calls[0][0];
    expect(saved).toMatchObject({ entidadTipo: "REGISTRO", entidadId: 11, subidoPor: 7 });
    expect(saved.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(Buffer.isBuffer(saved.contenido)).toBe(true);
  });

  it("el tipo del archivo lo decide el contenido, no el Content-Type", async () => {
    const res = await upload("/api/adjuntos/REGISTRO/11", Buffer.from("<html>no soy imagen</html> relleno"));

    expect(res.statusCode).toBe(415);
    expect(adjuntoModel.create).not.toHaveBeenCalled();
  });

  it("415 si el cuerpo no llega como imagen", async () => {
    const res = await request(app)
      .post("/api/adjuntos/REGISTRO/11")
      .set("Content-Type", "application/json")
      .send({ foto: "base64..." });

    expect(res.statusCode).toBe(415);
  });

  it("413 si supera el tamano maximo", async () => {
    const res = await upload("/api/adjuntos/REGISTRO/11", Buffer.concat([JPEG, Buffer.alloc(3000, 2)]));

    expect(res.statusCode).toBe(413);
    expect(adjuntoModel.create).not.toHaveBeenCalled();
  });

  it("400 con un tipo de entidad invalido o un id que no es numero", async () => {
    expect((await upload("/api/adjuntos/PERFIL/11")).statusCode).toBe(400);
    expect((await upload("/api/adjuntos/REGISTRO/abc")).statusCode).toBe(400);
  });

  it("acepta el tipo en minusculas", async () => {
    const res = await upload("/api/adjuntos/registro/11");
    expect(res.statusCode).toBe(201);
    expect(adjuntoModel.findEntityContext).toHaveBeenCalledWith("REGISTRO", 11);
  });

  it("404 si la fiscalizacion no existe", async () => {
    adjuntoModel.findEntityContext.mockResolvedValue(null);
    expect((await upload()).statusCode).toBe(404);
  });

  it("403 si es otro fiscal, un propietario o alguien ajeno a la asociacion", async () => {
    asRole("FISCAL");
    adjuntoModel.findEntityContext.mockResolvedValue({ ...entity, creador_id: 55 });
    expect((await upload()).statusCode).toBe(403);

    asRole("PROPIETARIO");
    adjuntoModel.findEntityContext.mockResolvedValue(entity);
    expect((await upload()).statusCode).toBe(403);

    asRole();
    expect((await upload()).statusCode).toBe(403);
    expect(adjuntoModel.create).not.toHaveBeenCalled();
  });

  it("un administrador puede subir a cualquier registro de su asociacion", async () => {
    asRole("ADMIN");
    adjuntoModel.findEntityContext.mockResolvedValue({ ...entity, creador_id: 55 });
    expect((await upload()).statusCode).toBe(201);
  });

  it("409 al llegar al limite: 1 por fiscalizacion, 3 por incidencia", async () => {
    adjuntoModel.countByEntity.mockResolvedValue(1);
    expect((await upload()).statusCode).toBe(409);

    adjuntoModel.countByEntity.mockResolvedValue(2);
    expect((await upload("/api/adjuntos/INCIDENCIA/11")).statusCode).toBe(201);

    adjuntoModel.countByEntity.mockResolvedValue(3);
    expect((await upload("/api/adjuntos/INCIDENCIA/11")).statusCode).toBe(409);
  });

  it("409 si dos envios simultaneos chocan con el indice unico", async () => {
    adjuntoModel.create.mockRejectedValue(Object.assign(new Error("dup"), { code: "23505" }));
    expect((await upload()).statusCode).toBe(409);
  });
});

describe("GET /api/adjuntos/:id", () => {
  const file = {
    id: 99,
    entidad_tipo: "REGISTRO",
    entidad_id: 11,
    mime: "image/jpeg",
    contenido: JPEG,
    purgado_at: null,
  };

  beforeEach(() => adjuntoModel.findContent.mockResolvedValue(file));

  it("200 con la imagen y cabeceras seguras para el propietario de la unidad", async () => {
    mockCurrentUser = { id: 9 };
    asRole("PROPIETARIO");

    const res = await request(app).get("/api/adjuntos/99").buffer(true).parse((r, cb) => {
      const chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => cb(null, Buffer.concat(chunks)));
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["cache-control"]).toContain("private");
    expect(Buffer.compare(res.body, JPEG)).toBe(0);
  });

  it("fiscales y administradores de la asociacion tambien la ven", async () => {
    asRole("FISCAL");
    expect((await request(app).get("/api/adjuntos/99")).statusCode).toBe(200);
    asRole("ADMIN");
    expect((await request(app).get("/api/adjuntos/99")).statusCode).toBe(200);
  });

  it("403 para otro propietario o alguien ajeno", async () => {
    mockCurrentUser = { id: 10 };
    asRole("PROPIETARIO");
    expect((await request(app).get("/api/adjuntos/99")).statusCode).toBe(403);
    asRole();
    expect((await request(app).get("/api/adjuntos/99")).statusCode).toBe(403);
  });

  it("404 si no existe y 410 si fue purgada", async () => {
    adjuntoModel.findContent.mockResolvedValue(null);
    expect((await request(app).get("/api/adjuntos/99")).statusCode).toBe(404);

    adjuntoModel.findContent.mockResolvedValue({ ...file, contenido: null, purgado_at: new Date() });
    expect((await request(app).get("/api/adjuntos/99")).statusCode).toBe(410);
  });
});

describe("GET /api/adjuntos/:tipo/:id (metadatos)", () => {
  it("lista las fotos de la entidad si el usuario puede verla", async () => {
    adjuntoModel.listByEntities.mockResolvedValue([{ id: 99 }]);

    const res = await request(app).get("/api/adjuntos/REGISTRO/11");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 99 }]);
    expect(adjuntoModel.listByEntities).toHaveBeenCalledWith("REGISTRO", [11]);
  });

  it("403 sin acceso a la entidad", async () => {
    asRole();
    expect((await request(app).get("/api/adjuntos/REGISTRO/11")).statusCode).toBe(403);
  });
});

describe("GET /api/adjuntos/resumen/registros", () => {
  it("pasa solo ids validos (maximo 200) y el usuario actual", async () => {
    adjuntoModel.summaryForRegistros.mockResolvedValue([{ entidad_id: 11, adjunto_id: 99 }]);

    const res = await request(app).get("/api/adjuntos/resumen/registros?ids=11,abc,-3,0,12.5,13");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ entidad_id: 11, adjunto_id: 99 }]);
    expect(adjuntoModel.summaryForRegistros).toHaveBeenCalledWith([11, 13], 7);
  });

  it("limita la cantidad de ids por consulta", async () => {
    adjuntoModel.summaryForRegistros.mockResolvedValue([]);
    const ids = Array.from({ length: 500 }, (_, i) => i + 1).join(",");

    await request(app).get(`/api/adjuntos/resumen/registros?ids=${ids}`);

    expect(adjuntoModel.summaryForRegistros.mock.calls[0][0]).toHaveLength(200);
  });

  it("sin ids responde lista vacia", async () => {
    adjuntoModel.summaryForRegistros.mockResolvedValue([]);
    const res = await request(app).get("/api/adjuntos/resumen/registros");
    expect(res.body).toEqual([]);
  });
});
