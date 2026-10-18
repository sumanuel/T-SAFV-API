const mockClient = { query: jest.fn(), release: jest.fn() };
const mockPool = { query: jest.fn(), connect: jest.fn(async () => mockClient) };
jest.mock("../../src/config/database", () => mockPool);

const refreshTokenModel = require("../../src/models/refreshTokenModel");

const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);

const sqlOf = (call) => String(call[0]).trim().split(/\s+/)[0].toUpperCase();

beforeEach(() => {
  jest.clearAllMocks();
});

const run = (row) => {
  mockClient.query.mockImplementation(async (sql) => {
    const op = sqlOf([sql]);
    if (op === "SELECT") return { rows: row ? [row] : [] };
    if (op === "INSERT") return { rows: [{ id: 50 }] };
    return { rows: [], rowCount: 1 };
  });
  return refreshTokenModel.rotate({
    oldHash: "old",
    newHash: "new",
    newExpiresAt: future(),
  });
};

const ops = () => mockClient.query.mock.calls.map(sqlOf);

describe("rotate", () => {
  it("token inexistente -> invalid y rollback", async () => {
    expect(await run(null)).toEqual({ status: "invalid" });
    expect(ops()).toEqual(["BEGIN", "SELECT", "ROLLBACK"]);
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it("token expirado -> expired y rollback", async () => {
    const result = await run({ id: 1, usuario_id: 7, expires_at: past(), revoked_at: null });
    expect(result).toEqual({ status: "expired" });
    expect(ops()).toEqual(["BEGIN", "SELECT", "ROLLBACK"]);
  });

  it("token ya revocado -> reused y revoca todas las sesiones del usuario", async () => {
    const result = await run({ id: 1, usuario_id: 7, expires_at: future(), revoked_at: new Date() });
    expect(result).toEqual({ status: "reused" });
    expect(ops()).toEqual(["BEGIN", "SELECT", "UPDATE", "COMMIT"]);
    const update = mockClient.query.mock.calls[2];
    expect(update[0]).toMatch(/usuario_id = \$1/);
    expect(update[1]).toEqual([7]);
  });

  it("token valido -> inserta el nuevo, revoca el viejo y confirma", async () => {
    const result = await run({ id: 1, usuario_id: 7, expires_at: future(), revoked_at: null });
    expect(result).toEqual({ status: "ok", usuarioId: 7 });
    expect(ops()).toEqual(["BEGIN", "SELECT", "INSERT", "UPDATE", "COMMIT"]);
    expect(mockClient.query.mock.calls[3][1]).toEqual([1, 50]);
  });

  it("si algo falla hace rollback y libera la conexion", async () => {
    mockClient.query.mockImplementation(async (sql) => {
      if (sqlOf([sql]) === "SELECT") throw new Error("db caida");
      return { rows: [] };
    });
    await expect(
      refreshTokenModel.rotate({ oldHash: "o", newHash: "n", newExpiresAt: future() }),
    ).rejects.toThrow("db caida");
    expect(ops()).toEqual(["BEGIN", "SELECT", "ROLLBACK"]);
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});
