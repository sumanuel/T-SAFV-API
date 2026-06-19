const request = require("supertest");
const appPath = require("../index");

describe("Root endpoint", () => {
  it("responds 200 on /", async () => {
    const res = await request("http://localhost:3000").get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/T-SAFV API is running/);
  });
});
