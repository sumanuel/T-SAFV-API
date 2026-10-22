const { verifyMembershipInAssociation } = require("../middlewares/authMiddleware");

const ROLES_BY_PRIORITY = ["ADMIN", "FISCAL", "PROPIETARIO"];

// Rol activo del usuario en la asociacion (o null si no es miembro activo).
const resolveRoleInAssociation = async (usuarioId, asociacionId) => {
  for (const role of ROLES_BY_PRIORITY) {
    if (await verifyMembershipInAssociation(usuarioId, asociacionId, role)) {
      return role;
    }
  }
  return null;
};

// Administradores y fiscales ven todo lo de su asociacion; el propietario solo
// lo ligado a sus propias unidades.
const canViewEntity = ({ role, userId, entity }) => {
  if (role === "ADMIN" || role === "FISCAL") return true;
  if (role === "PROPIETARIO") {
    return (
      entity.propietario_id != null &&
      Number(entity.propietario_id) === Number(userId)
    );
  }
  return false;
};

// Sube fotos quien creo el registro/incidencia (fiscal o administrador) o
// cualquier administrador de la asociacion.
const canUploadToEntity = ({ role, userId, entity }) => {
  if (role === "ADMIN") return true;
  if (role === "FISCAL") {
    return (
      entity.creador_id != null && Number(entity.creador_id) === Number(userId)
    );
  }
  return false;
};

module.exports = { resolveRoleInAssociation, canViewEntity, canUploadToEntity };
