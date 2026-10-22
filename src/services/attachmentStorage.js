// Almacenamiento de fotos. Hoy guarda los bytes en la tabla `adjuntos`; la
// interfaz (save / read) permite pasar a disco externo u objeto sin tocar los
// controladores (ver PLAN-002 §2.1).
const adjuntoModel = require("../models/adjuntoModel");
const { sha256Hex } = require("../utils/imageValidation");

const save = ({ entidadTipo, entidadId, buffer, mime, subidoPor }) =>
  adjuntoModel.create({
    entidadTipo,
    entidadId,
    mime,
    bytes: buffer.length,
    sha256: sha256Hex(buffer),
    contenido: buffer,
    subidoPor,
  });

// Devuelve { mime, contenido, ... } o null si no existe. `contenido` es null si
// la foto fue purgada por la politica de retencion.
const read = (id) => adjuntoModel.findContent(id);

module.exports = { save, read };
