jest.mock("../../src/config/database", () => ({ query: jest.fn() }));

const { readRetentionConfig, purgeExpired } = require("../../src/services/retentionService");

const makeDb = (registroRows = [], incidenciaRows = []) => ({
  query: jest.fn(async (sql) => {
    if (/entidad_tipo = 'REGISTRO'/.test(sql)) return { rows: registroRows };
    if (/entidad_tipo = 'INCIDENCIA'/.test(sql)) return { rows: incidenciaRows };
    return { rows: [], rowCount: 0 };
  }),
});

describe("readRetentionConfig", () => {
  const DEFAULTS = { diasFotoRegistro: 90, mesesFotoIncidencia: 12 };

  it("sin variables usa los valores del plan: 90 dias y 12 meses", () => {
    expect(readRetentionConfig({})).toEqual(DEFAULTS);
  });

  it("vacio o invalido vuelve al valor por defecto", () => {
    expect(
      readRetentionConfig({ RETENCION_DIAS_FOTO_REGISTRO: "", RETENCION_MESES_FOTO_INCIDENCIA: "abc" }),
    ).toEqual(DEFAULTS);
    expect(readRetentionConfig({ RETENCION_DIAS_FOTO_REGISTRO: "-5" }).diasFotoRegistro).toBe(90);
    expect(readRetentionConfig({ RETENCION_DIAS_FOTO_REGISTRO: "1.5" }).diasFotoRegistro).toBe(90);
  });

  it("0 desactiva esa retencion", () => {
    expect(
      readRetentionConfig({ RETENCION_DIAS_FOTO_REGISTRO: "0", RETENCION_MESES_FOTO_INCIDENCIA: "0" }),
    ).toEqual({ diasFotoRegistro: null, mesesFotoIncidencia: null });
    expect(readRetentionConfig({ RETENCION_DIAS_FOTO_REGISTRO: "0" }).mesesFotoIncidencia).toBe(12);
  });

  it("lee otros valores positivos", () => {
    expect(
      readRetentionConfig({ RETENCION_DIAS_FOTO_REGISTRO: "30", RETENCION_MESES_FOTO_INCIDENCIA: "24" }),
    ).toEqual({ diasFotoRegistro: 30, mesesFotoIncidencia: 24 });
  });
});

describe("purgeExpired", () => {
  it("sin configuracion no consulta ni borra nada", async () => {
    const db = makeDb();
    const result = await purgeExpired({ config: { diasFotoRegistro: null, mesesFotoIncidencia: null }, apply: true, db });

    expect(result).toMatchObject({ configured: false, applied: false });
    expect(db.query).not.toHaveBeenCalled();
  });

  it("por defecto solo informa: cuenta y suma bytes pero no modifica", async () => {
    const db = makeDb([{ id: 1, bytes: 1000 }, { id: 2, bytes: 500 }], [{ id: 3, bytes: 250 }]);

    const result = await purgeExpired({ config: { diasFotoRegistro: 90, mesesFotoIncidencia: 12 }, db });

    expect(result.registro).toEqual({ count: 2, bytes: 1500, ids: [1, 2] });
    expect(result.incidencia).toEqual({ count: 1, bytes: 250, ids: [3] });
    expect(result.applied).toBe(false);
    expect(db.query.mock.calls.some(([sql]) => /UPDATE/.test(sql))).toBe(false);
  });

  it("con apply borra el contenido de todas las vencidas pero conserva la fila", async () => {
    const db = makeDb([{ id: 1, bytes: 10 }], [{ id: 3, bytes: 5 }]);

    const result = await purgeExpired({ config: { diasFotoRegistro: 90, mesesFotoIncidencia: 12 }, apply: true, db });

    expect(result.applied).toBe(true);
    const update = db.query.mock.calls.find(([sql]) => /UPDATE/.test(sql));
    expect(update[0]).toMatch(/contenido = NULL, purgado_at = NOW\(\)/);
    expect(update[0]).not.toMatch(/DELETE/);
    expect(update[1]).toEqual([[1, 3]]);
  });

  it("solo purga el tipo configurado", async () => {
    const db = makeDb([{ id: 1, bytes: 10 }], [{ id: 3, bytes: 5 }]);

    const result = await purgeExpired({ config: { diasFotoRegistro: 90, mesesFotoIncidencia: null }, apply: true, db });

    expect(result.incidencia).toBeNull();
    expect(db.query.mock.calls.find(([sql]) => /UPDATE/.test(sql))[1]).toEqual([[1]]);
  });

  it("las incidencias abiertas o en revision nunca se purgan (solo las cerradas)", async () => {
    const db = makeDb();
    await purgeExpired({ config: { diasFotoRegistro: null, mesesFotoIncidencia: 12 }, db });

    const select = db.query.mock.calls[0][0];
    expect(select).toMatch(/i\.estado = 'CERRADA'/);
    expect(select).toMatch(/i\.cerrada_at < NOW\(\) - make_interval\(months => \$1\)/);
    expect(db.query.mock.calls[0][1]).toEqual([12]);
  });

  it("con apply pero sin nada vencido no ejecuta el UPDATE", async () => {
    const db = makeDb([], []);
    const result = await purgeExpired({ config: { diasFotoRegistro: 90, mesesFotoIncidencia: 12 }, apply: true, db });

    expect(result.applied).toBe(false);
    expect(db.query.mock.calls.some(([sql]) => /UPDATE/.test(sql))).toBe(false);
  });
});
