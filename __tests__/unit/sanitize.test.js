const sanitize = require("../../src/middlewares/sanitize");

const run = (req) => {
  const next = jest.fn();
  sanitize(req, {}, next);
  return next;
};

describe("sanitize middleware", () => {
  it("limpia HTML peligroso en textos, incluso anidados", () => {
    const req = {
      body: { nombre: "<script>alert(1)</script>Ana", datos: { nota: "<img src=x onerror=alert(1)>" } },
      params: {},
      query: { q: "<b onclick=x>hola</b>" },
    };

    run(req);

    expect(req.body.nombre).not.toContain("<script>");
    expect(req.body.datos.nota).not.toContain("onerror");
    expect(req.query.q).not.toContain("onclick");
  });

  it("no recorre un cuerpo binario (Buffer) y lo deja intacto", () => {
    const body = Buffer.alloc(3 * 1024 * 1024, 7);
    const keysSpy = jest.spyOn(Object, "keys");

    const start = Date.now();
    const next = run({ body, params: {}, query: {} });

    expect(next).toHaveBeenCalled();
    expect(body[0]).toBe(7);
    // Si recorriera el Buffer, Object.keys se llamaria con el y generaria 3 M de claves.
    expect(keysSpy.mock.calls.some(([arg]) => arg === body)).toBe(false);
    expect(Date.now() - start).toBeLessThan(500);
    keysSpy.mockRestore();
  });

  it("siempre continua, aunque no haya cuerpo", () => {
    expect(run({ params: {}, query: {} })).toHaveBeenCalled();
    expect(run({ body: null, params: {}, query: {} })).toHaveBeenCalled();
  });
});
