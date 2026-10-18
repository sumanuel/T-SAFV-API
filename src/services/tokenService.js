const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const refreshTokenModel = require("../models/refreshTokenModel");
require("dotenv").config();

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "24h";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30;

const generateRefreshToken = () => crypto.randomBytes(48).toString("base64url");

const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const refreshExpiryDate = () =>
  new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

const publicUser = (user, access) => ({
  id: user.id,
  rol: user.rol || "ADMIN",
  nombre: user.nombre,
  apellido: user.apellido,
  email: user.email,
  telefono: user.telefono,
  rif_cedula: user.rif_cedula,
  direccion: user.direccion,
  association_creation_access: access,
});

const signAccessToken = (user, access) =>
  jwt.sign(publicUser(user, access), process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

// Emite access token + refresh token nuevo (login).
const issueSession = async (user) => {
  const access = await userModel.getAssociationCreationAccess({
    userId: user.id,
    email: user.email,
  });
  let refreshToken = null;
  try {
    const candidate = generateRefreshToken();
    await refreshTokenModel.create({
      usuarioId: user.id,
      tokenHash: hashToken(candidate),
      expiresAt: refreshExpiryDate(),
    });
    refreshToken = candidate;
  } catch (error) {
    // Si la migracion 0009 aun no se aplico, el login sigue funcionando sin
    // refresh token (la app cae al comportamiento anterior de 24 h).
    console.error("No se pudo emitir refresh token:", error.message);
  }
  return {
    token: signAccessToken(user, access),
    ...(refreshToken ? { refresh_token: refreshToken } : {}),
    user: publicUser(user, access),
  };
};

// Canjea un refresh token por una sesion nueva (con rotacion).
// Devuelve { ok: true, session } o { ok: false, reason }.
const refreshSession = async (presentedToken) => {
  const newToken = generateRefreshToken();
  const rotated = await refreshTokenModel.rotate({
    oldHash: hashToken(presentedToken),
    newHash: hashToken(newToken),
    newExpiresAt: refreshExpiryDate(),
  });

  if (rotated.status !== "ok") {
    return { ok: false, reason: rotated.status };
  }

  const user = await userModel.findUserById(rotated.usuarioId);
  if (!user) {
    await refreshTokenModel.revokeAllForUser(rotated.usuarioId);
    return { ok: false, reason: "invalid" };
  }

  const access = await userModel.getAssociationCreationAccess({
    userId: user.id,
    email: user.email,
  });
  return {
    ok: true,
    session: {
      token: signAccessToken(user, access),
      refresh_token: newToken,
      user: publicUser(user, access),
    },
  };
};

const revokeSession = (presentedToken) =>
  refreshTokenModel.revokeByHash(hashToken(presentedToken));

module.exports = {
  generateRefreshToken,
  hashToken,
  issueSession,
  refreshSession,
  revokeSession,
};
