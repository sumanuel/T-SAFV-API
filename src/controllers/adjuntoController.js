const adjuntoModel = require("../models/adjuntoModel");
const attachmentStorage = require("../services/attachmentStorage");
const {
  resolveRoleInAssociation,
  canViewEntity,
  canUploadToEntity,
} = require("../services/accessService");
const { MAX_ADJUNTOS } = require("../constants/incidencias");
const { detectImageType, maxImageBytes } = require("../utils/imageValidation");

const MAX_SUMMARY_IDS = 200;

// Carga la entidad y el rol del usuario; responde 404/403 y devuelve null si no
// se puede continuar.
const loadEntityAccess = async (req, res, entidadTipo, entidadId, check) => {
  const entity = await adjuntoModel.findEntityContext(entidadTipo, entidadId);
  if (!entity) {
    res.status(404).json({ message: "Registro no encontrado" });
    return null;
  }
  const role = await resolveRoleInAssociation(req.user.id, entity.asociacion_id);
  if (!check({ role, userId: req.user.id, entity })) {
    res.status(403).json({ message: "No tienes acceso a este registro" });
    return null;
  }
  return { entity, role };
};

const upload = async (req, res) => {
  const entidadTipo = String(req.params.entidad_tipo).toUpperCase();
  const entidadId = Number(req.params.entidad_id);
  const buffer = req.body;

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return res
      .status(415)
      .json({ message: "Envía la imagen (JPEG o PNG) como cuerpo binario" });
  }
  if (buffer.length > maxImageBytes()) {
    return res.status(413).json({ message: "La imagen es demasiado grande" });
  }
  // El tipo real sale de los bytes, no de lo que declare el cliente.
  const type = detectImageType(buffer);
  if (!type) {
    return res.status(415).json({ message: "Solo se aceptan imágenes JPEG o PNG" });
  }

  try {
    const access = await loadEntityAccess(
      req,
      res,
      entidadTipo,
      entidadId,
      canUploadToEntity,
    );
    if (!access) return;

    const current = await adjuntoModel.countByEntity(entidadTipo, entidadId);
    if (current >= MAX_ADJUNTOS[entidadTipo]) {
      return res.status(409).json({
        message: `Límite de fotos alcanzado (${MAX_ADJUNTOS[entidadTipo]})`,
      });
    }

    const saved = await attachmentStorage.save({
      entidadTipo,
      entidadId,
      buffer,
      mime: type.mime,
      subidoPor: req.user.id,
    });
    res.status(201).json({
      id: saved.id,
      entidad_tipo: saved.entidad_tipo,
      entidad_id: saved.entidad_id,
      mime: saved.mime,
      bytes: saved.bytes,
    });
  } catch (error) {
    // Indice unico: ya hay una foto para esta fiscalizacion (carrera entre dos envios).
    if (error.code === "23505") {
      return res.status(409).json({ message: "Esta fiscalización ya tiene foto" });
    }
    res
      .status(500)
      .json({ message: "Error subiendo la foto", error: error.message });
  }
};

const download = async (req, res) => {
  try {
    const file = await attachmentStorage.read(Number(req.params.id));
    if (!file) return res.status(404).json({ message: "Foto no encontrada" });

    const access = await loadEntityAccess(
      req,
      res,
      file.entidad_tipo,
      file.entidad_id,
      canViewEntity,
    );
    if (!access) return;

    if (file.purgado_at || !file.contenido) {
      return res
        .status(410)
        .json({ message: "La foto fue eliminada por la política de conservación" });
    }

    res.set({
      "Content-Type": file.mime,
      "Content-Length": String(file.contenido.length),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    });
    res.end(file.contenido);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error leyendo la foto", error: error.message });
  }
};

const listByEntity = async (req, res) => {
  const entidadTipo = String(req.params.entidad_tipo).toUpperCase();
  const entidadId = Number(req.params.entidad_id);
  try {
    const access = await loadEntityAccess(
      req,
      res,
      entidadTipo,
      entidadId,
      canViewEntity,
    );
    if (!access) return;
    res.json(await adjuntoModel.listByEntities(entidadTipo, [entidadId]));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listando fotos", error: error.message });
  }
};

// Para pintar miniaturas en Traza: ids de fiscalizacion -> id de su foto.
const summaryForRegistros = async (req, res) => {
  const ids = String(req.query.ids || "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(0, MAX_SUMMARY_IDS);

  try {
    res.json(await adjuntoModel.summaryForRegistros(ids, req.user.id));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error consultando fotos", error: error.message });
  }
};

module.exports = { upload, download, listByEntity, summaryForRegistros };
