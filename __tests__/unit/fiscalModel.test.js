const mockPool = { query: jest.fn() };
jest.mock("../../src/config/database", () => mockPool);
jest.mock("../../src/services/notificationService", () => ({ notifyUser: jest.fn() }));

const { notifyUser } = require("../../src/services/notificationService");
const fiscalModel = require("../../src/models/fiscalModel");

const CLIENT_ID = "6f1c4d0e-1a2b-4c3d-8e4f-5a6b7c8d9e0f";
const WHEN = new Date("2026-10-18T10:00:00Z");
const row = { id: 11, unidad_id: 3 };

const create = (opts) =>
  fiscalModel.createRegistroFiscalizacion(3, 7, 1, "Pedro", "A", "B", 20, WHEN, opts);

const sqlStart = (call) => String(call[0]).trim().split(/\s+/).slice(0, 3).join(" ").toUpperCase();

// Respuestas por tipo de consulta, en el orden en que las hace el modelo.
const route = (handlers) =>
  mockPool.query.mockImplementation(async (sql, params) => {
    for (const [pattern, handler] of handlers) {
      if (pattern.test(sql)) return typeof handler === "function" ? handler(sql, params) : handler;
    }
    throw new Error("consulta inesperada: " + sql.slice(0, 60));
  });

const profile = [/FROM fiscales/, { rows: [{ punto_control: "Peaje Norte" }] }];
const owner = [/FROM unidades_transporte/, { rows: [{ propietario_id: 9, placa: "AB1", numero_unidad: "010" }] }];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => console.error.mockRestore());

describe("createRegistroFiscalizacion", () => {
  it("sin client_request_id inserta como antes y notifica", async () => {
    route([profile, [/INSERT INTO registros_fiscalizacion/, { rows: [row] }], owner]);

    const result = await create();

    expect(result).toEqual({ registro: row, duplicate: false });
    const insert = mockPool.query.mock.calls.find((c) => /INSERT/.test(c[0]));
    expect(insert[0]).not.toMatch(/client_request_id/);
    expect(notifyUser).toHaveBeenCalledTimes(1);
  });

  it("con client_request_id nuevo inserta con ON CONFLICT y notifica", async () => {
    route([profile, [/ON CONFLICT/, { rows: [row] }], owner]);

    const result = await create({ clientRequestId: CLIENT_ID });

    expect(result).toEqual({ registro: row, duplicate: false });
    const insert = mockPool.query.mock.calls.find((c) => /ON CONFLICT/.test(c[0]));
    expect(insert[1][9]).toBe(CLIENT_ID);
    expect(insert[1][7]).toBe(WHEN);
    expect(notifyUser).toHaveBeenCalledTimes(1);
  });

  it("un reintento devuelve el registro original y NO vuelve a notificar", async () => {
    route([
      profile,
      [/ON CONFLICT/, { rows: [] }],
      [/WHERE fiscal_id = \$1 AND client_request_id = \$2/, { rows: [row] }],
    ]);

    const result = await create({ clientRequestId: CLIENT_ID });

    expect(result).toEqual({ registro: row, duplicate: true });
    expect(notifyUser).not.toHaveBeenCalled();
  });

  it.each(["42703", "42P10"])(
    "si la migracion 0010 no esta aplicada (%s) guarda sin idempotencia",
    async (code) => {
      route([
        profile,
        [
          /ON CONFLICT/,
          () => {
            const err = new Error("falta migracion");
            err.code = code;
            throw err;
          },
        ],
        [/INSERT INTO registros_fiscalizacion \(unidad_id[^)]*punto_control\)\s+VALUES/, { rows: [row] }],
        owner,
      ]);

      const result = await create({ clientRequestId: CLIENT_ID });

      expect(result).toEqual({ registro: row, duplicate: false });
      expect(notifyUser).toHaveBeenCalledTimes(1);
    },
  );

  it("otros errores de base de datos se propagan", async () => {
    route([
      profile,
      [
        /ON CONFLICT/,
        () => {
          const err = new Error("conexion perdida");
          err.code = "08006";
          throw err;
        },
      ],
    ]);

    await expect(create({ clientRequestId: CLIENT_ID })).rejects.toThrow("conexion perdida");
    expect(notifyUser).not.toHaveBeenCalled();
  });

  it("un fallo al notificar no impide guardar el registro", async () => {
    notifyUser.mockRejectedValueOnce(new Error("push caido"));
    route([profile, [/INSERT INTO registros_fiscalizacion/, { rows: [row] }], owner]);

    await expect(create()).resolves.toEqual({ registro: row, duplicate: false });
  });
});
