jest.mock("../../src/config/database", () => ({ query: jest.fn() }));

const pool = require("../../src/config/database");
const { isFiscalOrAdmin } = require("../../src/middlewares/authMiddleware");

// Simula membresias: devuelve la fila solo si el rol consultado coincide.
const memberAs = (rol) =>
  pool.query.mockImplementation(async (sql, params) => {
    if (/FROM membresias/.test(sql)) {
      return { rows: params[2] === rol ? [{ id: 1, rol }] : [] };
    }
    if (/historial_estados/.test(sql)) return { rows: [] };
    if (/FROM (fiscales|propietarios)/.test(sql)) return { rows: [{ estado_invitacion: "ACEPTADA" }] };
    return { rows: [] };
  });

const run = async (req) => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  await isFiscalOrAdmin(req, res, next);
  return { res, next };
};

const req = (overrides = {}) => ({
  user: { id: 7 },
  params: {},
  query: {},
  body: { asociacion_id: 1 },
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe("isFiscalOrAdmin", () => {
  it.each(["ADMIN", "FISCAL"])("deja pasar a un %s", async (rol) => {
    memberAs(rol);
    const { next, res } = await run(req());
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rechaza a un propietario con 403", async () => {
    memberAs("PROPIETARIO");
    const { next, res } = await run(req());
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rechaza a quien no es miembro", async () => {
    memberAs(null);
    const { res } = await run(req());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("400 si falta la asociacion o el usuario", async () => {
    memberAs("ADMIN");
    expect((await run(req({ body: {} }))).res.status).toHaveBeenCalledWith(400);
    expect((await run(req({ user: undefined }))).res.status).toHaveBeenCalledWith(400);
  });

  it("toma la asociacion de params o query si no viene en el cuerpo", async () => {
    memberAs("FISCAL");
    const { next } = await run(req({ body: {}, params: { asociacion_id: 4 } }));
    expect(next).toHaveBeenCalled();
    expect(pool.query.mock.calls[0][1][1]).toBe(4);
  });
});
