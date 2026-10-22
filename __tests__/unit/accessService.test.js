jest.mock("../../src/middlewares/authMiddleware", () => ({
  verifyMembershipInAssociation: jest.fn(),
}));

const {
  verifyMembershipInAssociation,
} = require("../../src/middlewares/authMiddleware");
const {
  resolveRoleInAssociation,
  canViewEntity,
  canUploadToEntity,
} = require("../../src/services/accessService");

beforeEach(() => jest.clearAllMocks());

describe("resolveRoleInAssociation", () => {
  const memberOf = (...roles) =>
    verifyMembershipInAssociation.mockImplementation(
      async (_user, _assoc, role) => roles.includes(role),
    );

  it("devuelve el rol activo con prioridad ADMIN > FISCAL > PROPIETARIO", async () => {
    memberOf("PROPIETARIO", "FISCAL");
    expect(await resolveRoleInAssociation(1, 2)).toBe("FISCAL");

    memberOf("PROPIETARIO", "FISCAL", "ADMIN");
    expect(await resolveRoleInAssociation(1, 2)).toBe("ADMIN");

    memberOf("PROPIETARIO");
    expect(await resolveRoleInAssociation(1, 2)).toBe("PROPIETARIO");
  });

  it("sin membresia activa devuelve null", async () => {
    memberOf();
    expect(await resolveRoleInAssociation(1, 2)).toBeNull();
  });
});

describe("canViewEntity", () => {
  const entity = { propietario_id: 9, creador_id: 5 };

  it("administradores y fiscales ven todo lo de su asociacion", () => {
    expect(canViewEntity({ role: "ADMIN", userId: 1, entity })).toBe(true);
    expect(canViewEntity({ role: "FISCAL", userId: 1, entity })).toBe(true);
  });

  it("el propietario solo ve lo de sus unidades", () => {
    expect(canViewEntity({ role: "PROPIETARIO", userId: 9, entity })).toBe(true);
    expect(canViewEntity({ role: "PROPIETARIO", userId: "9", entity })).toBe(true);
    expect(canViewEntity({ role: "PROPIETARIO", userId: 10, entity })).toBe(false);
  });

  it("una entidad sin unidad no es visible para un propietario", () => {
    expect(
      canViewEntity({ role: "PROPIETARIO", userId: 9, entity: { propietario_id: null } }),
    ).toBe(false);
  });

  it("sin rol (no es miembro) no ve nada", () => {
    expect(canViewEntity({ role: null, userId: 1, entity })).toBe(false);
  });
});

describe("canUploadToEntity", () => {
  const entity = { creador_id: 5 };

  it("el administrador sube a cualquier entidad de su asociacion", () => {
    expect(canUploadToEntity({ role: "ADMIN", userId: 1, entity })).toBe(true);
  });

  it("el fiscal solo a lo que el mismo creo", () => {
    expect(canUploadToEntity({ role: "FISCAL", userId: 5, entity })).toBe(true);
    expect(canUploadToEntity({ role: "FISCAL", userId: 6, entity })).toBe(false);
  });

  it("el propietario nunca sube", () => {
    expect(canUploadToEntity({ role: "PROPIETARIO", userId: 5, entity })).toBe(false);
    expect(canUploadToEntity({ role: null, userId: 5, entity })).toBe(false);
  });
});
