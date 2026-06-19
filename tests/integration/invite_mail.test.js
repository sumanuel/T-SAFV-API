jest.mock("nodemailer");
const nodemailer = require("nodemailer");
const request = require("supertest");
const app = require("../../index");
const base = request(app);

describe("Invitation email", () => {
  it("sends email when creating invitation", async () => {
    const ts = Date.now();
    const adminEmail = `mail_admin_${ts}@example.com`;
    const invitedEmail = `mail_user_${ts}@example.com`;
    const pwd = "Secret123!";

    await base
      .post("/api/auth/register")
      .send({ nombre: "Mail Admin", email: adminEmail, password: pwd });
    const login = await base
      .post("/api/auth/login")
      .send({ email: adminEmail, password: pwd });
    const token = login.body.token;

    const asoc = await base
      .post("/api/asociaciones")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: `Asoc ${ts}`, rif: `J-${ts}` });

    const inv = await base
      .post("/api/invitaciones")
      .set("Authorization", `Bearer ${token}`)
      .send({
        asociacion_id: asoc.body.id,
        email_invitado: invitedEmail,
        rol_invitado: "PROPIETARIO",
      });
    expect(inv.statusCode).toBe(201);

    // nodemailer mock exported 'sent' array
    const mock = require("nodemailer");
    expect(mock.sent.length).toBeGreaterThanOrEqual(1);
    const mail = mock.sent[mock.sent.length - 1];
    expect(mail.to).toBe(invitedEmail);
  });
});
