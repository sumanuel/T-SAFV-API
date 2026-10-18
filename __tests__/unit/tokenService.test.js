process.env.JWT_SECRET = "test-secret";

jest.mock("../../src/models/userModel", () => ({
  getAssociationCreationAccess: jest.fn(),
  findUserById: jest.fn(),
}));
jest.mock("../../src/models/refreshTokenModel", () => ({
  create: jest.fn(),
  rotate: jest.fn(),
  revokeAllForUser: jest.fn(),
  revokeByHash: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const userModel = require("../../src/models/userModel");
const refreshTokenModel = require("../../src/models/refreshTokenModel");
const tokenService = require("../../src/services/tokenService");

const user = {
  id: 7,
  rol: "ADMIN",
  nombre: "Ana",
  apellido: "Perez",
  email: "ana@example.com",
  telefono: "0412",
  rif_cedula: "V-1",
  direccion: "Calle 1",
  password: "hash-que-no-debe-salir",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  userModel.getAssociationCreationAccess.mockResolvedValue({ allowed: true });
});

afterEach(() => console.error.mockRestore());

describe("hashToken", () => {
  it("es determinista y devuelve 64 hex", () => {
    const a = tokenService.hashToken("abc");
    expect(a).toBe(tokenService.hashToken("abc"));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(tokenService.hashToken("abd"));
  });
});

describe("issueSession", () => {
  it("devuelve JWT valido, refresh token y usuario sin password", async () => {
    refreshTokenModel.create.mockResolvedValue({ id: 1 });

    const session = await tokenService.issueSession(user);

    const decoded = jwt.verify(session.token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(7);
    expect(session.refresh_token).toEqual(expect.any(String));
    expect(session.refresh_token.length).toBeGreaterThanOrEqual(60);
    expect(session.user.password).toBeUndefined();

    const stored = refreshTokenModel.create.mock.calls[0][0];
    expect(stored.tokenHash).toBe(tokenService.hashToken(session.refresh_token));
    expect(stored.tokenHash).not.toBe(session.refresh_token);
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("sigue entregando el JWT si no se puede guardar el refresh token", async () => {
    refreshTokenModel.create.mockRejectedValue(new Error('relation "refresh_tokens" does not exist'));

    const session = await tokenService.issueSession(user);

    expect(jwt.verify(session.token, process.env.JWT_SECRET).id).toBe(7);
    expect(session.refresh_token).toBeUndefined();
  });
});

describe("refreshSession", () => {
  it("rota el token y devuelve una sesion nueva", async () => {
    refreshTokenModel.rotate.mockResolvedValue({ status: "ok", usuarioId: 7 });
    userModel.findUserById.mockResolvedValue(user);

    const result = await tokenService.refreshSession("token-viejo");

    expect(result.ok).toBe(true);
    expect(result.session.refresh_token).toEqual(expect.any(String));
    const rotateArgs = refreshTokenModel.rotate.mock.calls[0][0];
    expect(rotateArgs.oldHash).toBe(tokenService.hashToken("token-viejo"));
    expect(rotateArgs.newHash).toBe(
      tokenService.hashToken(result.session.refresh_token),
    );
    expect(jwt.verify(result.session.token, process.env.JWT_SECRET).id).toBe(7);
  });

  it.each(["invalid", "expired", "reused"])("rechaza un token %s", async (status) => {
    refreshTokenModel.rotate.mockResolvedValue({ status });

    const result = await tokenService.refreshSession("x");

    expect(result).toEqual({ ok: false, reason: status });
    expect(userModel.findUserById).not.toHaveBeenCalled();
  });

  it("revoca las sesiones si el usuario ya no existe", async () => {
    refreshTokenModel.rotate.mockResolvedValue({ status: "ok", usuarioId: 99 });
    userModel.findUserById.mockResolvedValue(null);

    const result = await tokenService.refreshSession("x");

    expect(result.ok).toBe(false);
    expect(refreshTokenModel.revokeAllForUser).toHaveBeenCalledWith(99);
  });
});

describe("revokeSession", () => {
  it("revoca por hash, nunca por valor en claro", async () => {
    refreshTokenModel.revokeByHash.mockResolvedValue(true);

    await tokenService.revokeSession("mi-token");

    expect(refreshTokenModel.revokeByHash).toHaveBeenCalledWith(
      tokenService.hashToken("mi-token"),
    );
  });
});
