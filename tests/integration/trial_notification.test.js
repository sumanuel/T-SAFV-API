const request = require("supertest");
const app = require("../../index");
const pool = require("../../src/config/database");
const base = request(app);
jest.setTimeout(20000);

const ts = Date.now();
const email = `trial_notif_${ts}@example.com`;
const pwd = "Secret123!";

describe("Trial/payment activation notifies the user on next access check", () => {
  let userId;
  let paymentId;

  it("registers and logs in", async () => {
    const reg = await base
      .post("/api/auth/register")
      .send({ nombre: "Trial Notif", email, password: pwd });
    expect([200, 201]).toContain(reg.statusCode);
    userId = reg.body.user.id;

    const login = await base.post("/api/auth/login").send({ email, password: pwd });
    expect(login.statusCode).toBe(200);
  });

  it("simulates a manual DB approval of a trial (no app endpoint involved)", async () => {
    const res = await pool.query(
      `INSERT INTO asociacion_pagos (
         asociacion_id, usuario_id, monto, moneda, fecha_desde, fecha_hasta,
         referencia, notas, estado, registrado_por_usuario_id, es_trial
       ) VALUES (NULL, $1, NULL, 'USD', CURRENT_DATE, (CURRENT_DATE + INTERVAL '7 days')::date,
         'TRIAL-MANUAL-TEST', 'Aprobado manualmente por BD (test)', 'ACTIVO', $1, TRUE)
       RETURNING id`,
      [userId],
    );
    paymentId = res.rows[0].id;

    const check = await pool.query(
      "SELECT notificado_en FROM asociacion_pagos WHERE id = $1",
      [paymentId],
    );
    expect(check.rows[0].notificado_en).toBeNull();
  });

  it("marks the entitlement as notified the first time access is checked", async () => {
    const login = await base.post("/api/auth/login").send({ email, password: pwd });
    expect(login.statusCode).toBe(200);
    expect(login.body.user.association_creation_access.reason_code).toBe(
      "TRIAL_ACTIVE",
    );

    const check = await pool.query(
      "SELECT notificado_en FROM asociacion_pagos WHERE id = $1",
      [paymentId],
    );
    expect(check.rows[0].notificado_en).not.toBeNull();
  });

  afterAll(async () => {
    await pool.query("DELETE FROM asociacion_pagos WHERE id = $1", [paymentId]);
  });
});
