const request = require("supertest");
const app = require("../../index");
const base = request(app);
jest.setTimeout(20000);
const ts = Date.now();
const adminEmail = `claim_admin_${ts}@example.com`;
const memberEmail = `claim_member_${ts}@example.com`;
const pwd = "Secret123!";
const attackerPwd = "Attacker456!";

describe("claimReservedUser does not allow taking over an already-claimed account", () => {
  let adminToken;

  it("registers and logs admin", async () => {
    const r1 = await base
      .post("/api/auth/register")
      .send({ nombre: "Claim Admin", email: adminEmail, password: pwd });
    expect([200, 201]).toContain(r1.statusCode);
    const r2 = await base
      .post("/api/auth/login")
      .send({ email: adminEmail, password: pwd });
    expect(r2.statusCode).toBe(200);
    adminToken = r2.body.token;
  });

  it("admin creates a member directly (pre-provisions a ghost user)", async () => {
    const asoc = await base
      .post("/api/asociaciones")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: `Claim Asoc ${ts}`,
        rif: `J-${ts}`,
        direccion_fiscal: "Av. Principal, Caracas",
        email: `claim_asoc_${ts}@example.com`,
        telefonos: "0212-0000000",
      });
    expect([200, 201]).toContain(asoc.statusCode);

    const member = await base
      .post(`/api/asociaciones/${asoc.body.id}/miembros`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: "Claim Member",
        email: memberEmail,
        rol: "PROPIETARIO",
      });
    expect(member.statusCode).toBe(201);
  });

  it("the invited person claims the account via register", async () => {
    const reg = await base
      .post("/api/auth/register")
      .send({ nombre: "Claim Member", email: memberEmail, password: pwd });
    expect(reg.statusCode).toBe(200);

    const login = await base
      .post("/api/auth/login")
      .send({ email: memberEmail, password: pwd });
    expect(login.statusCode).toBe(200);
  });

  it("a second registration with the same email does not take over the account", async () => {
    const attackerReg = await base
      .post("/api/auth/register")
      .send({
        nombre: "Attacker",
        email: memberEmail,
        password: attackerPwd,
      });
    expect(attackerReg.statusCode).toBe(409);

    const originalStillWorks = await base
      .post("/api/auth/login")
      .send({ email: memberEmail, password: pwd });
    expect(originalStillWorks.statusCode).toBe(200);

    const attackerLoginFails = await base
      .post("/api/auth/login")
      .send({ email: memberEmail, password: attackerPwd });
    expect(attackerLoginFails.statusCode).toBe(400);
  });
});
