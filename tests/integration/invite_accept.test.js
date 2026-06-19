const request = require("supertest");
const app = require("../../index");
const base = request(app);
const ts = Date.now();
const adminEmail = `invite_admin_${ts}@example.com`;
const invitedEmail = `invite_user_${ts}@example.com`;
const pwd = "Secret123!";

describe("Invitation create and accept flow", () => {
  let adminToken;
  let invitedToken;
  let inviteToken;

  it("registers and logs admin", async () => {
    const r1 = await base
      .post("/api/auth/register")
      .send({ nombre: "Invite Admin", email: adminEmail, password: pwd });
    expect([200, 201]).toContain(r1.statusCode);
    const r2 = await base
      .post("/api/auth/login")
      .send({ email: adminEmail, password: pwd });
    expect(r2.statusCode).toBe(200);
    adminToken = r2.body.token;
  });

  it("creates association and invitation", async () => {
    const asoc = await base
      .post("/api/asociaciones")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ nombre: `Asoc ${ts}`, rif: `J-${ts}` });
    expect([200, 201]).toContain(asoc.statusCode);
    const inv = await base
      .post("/api/invitaciones")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        asociacion_id: asoc.body.id,
        email_invitado: invitedEmail,
        rol_invitado: "PROPIETARIO",
      });
    expect(inv.statusCode).toBe(201);
    expect(inv.body.token_invitacion).toBeDefined();
    inviteToken = inv.body.token_invitacion;
  });

  it("registers invited user and accepts invitation", async () => {
    const reg = await base
      .post("/api/auth/register")
      .send({ nombre: "Invited", email: invitedEmail, password: pwd });
    expect([200, 201]).toContain(reg.statusCode);
    const login = await base
      .post("/api/auth/login")
      .send({ email: invitedEmail, password: pwd });
    expect(login.statusCode).toBe(200);
    invitedToken = login.body.token;

    const accept = await base
      .post("/api/invitaciones/respond")
      .set("Authorization", `Bearer ${invitedToken}`)
      .send({ token: inviteToken });
    expect(accept.statusCode).toBe(200);
    expect(accept.body.membresia).toBeDefined();
    expect(accept.body.historial).toBeDefined();
  });
});
