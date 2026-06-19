const request = require("supertest");

// These integration tests expect the API to be running on localhost:3000
const base = request("http://localhost:3000");
const ts = Date.now();
const email = `int_test_${ts}@example.com`;
const pwd = "Secret123!";

describe("Auth + Asociacion integration", () => {
  let token;
  it("registers a user", async () => {
    const res = await base
      .post("/api/auth/register")
      .send({ nombre: "Int Test", email, password: pwd });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.user).toBeDefined();
  });

  it("logs in", async () => {
    const res = await base
      .post("/api/auth/login")
      .send({ email, password: pwd });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it("creates asociacion", async () => {
    const res = await base
      .post("/api/asociaciones")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Int Asoc", rif: `J-${ts}` });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.id).toBeDefined();
  });
});
