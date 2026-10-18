process.env.JWT_SECRET = "test-secret";

jest.mock("../../src/config/database", () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock("../../src/models/userModel", () => ({}));
jest.mock("../../src/services/tokenService", () => ({
  refreshSession: jest.fn(),
  revokeSession: jest.fn(),
  issueSession: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const tokenService = require("../../src/services/tokenService");
const authRoutes = require("../../src/routes/authRoutes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

beforeEach(() => jest.clearAllMocks());

describe("POST /api/auth/refresh", () => {
  it("400 si falta refresh_token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.statusCode).toBe(400);
    expect(tokenService.refreshSession).not.toHaveBeenCalled();
  });

  it("401 con la razon cuando el token no sirve", async () => {
    tokenService.refreshSession.mockResolvedValue({ ok: false, reason: "reused" });
    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: "x" });
    expect(res.statusCode).toBe(401);
    expect(res.body.reason).toBe("reused");
  });

  it("200 con la sesion nueva", async () => {
    tokenService.refreshSession.mockResolvedValue({
      ok: true,
      session: { token: "jwt", refresh_token: "nuevo", user: { id: 1 } },
    });
    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: "viejo" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ token: "jwt", refresh_token: "nuevo", user: { id: 1 } });
    expect(tokenService.refreshSession).toHaveBeenCalledWith("viejo");
  });
});

describe("POST /api/auth/logout", () => {
  it("400 si falta refresh_token", async () => {
    const res = await request(app).post("/api/auth/logout").send({});
    expect(res.statusCode).toBe(400);
  });

  it("200 y revoca la sesion", async () => {
    tokenService.revokeSession.mockResolvedValue(true);
    const res = await request(app).post("/api/auth/logout").send({ refresh_token: "abc" });
    expect(res.statusCode).toBe(200);
    expect(tokenService.revokeSession).toHaveBeenCalledWith("abc");
  });
});
