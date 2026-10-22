// Catalogo de tipos de incidencia (confirmar con el negocio; ver PLAN-002 §5).
const INCIDENCIA_TIPOS = [
  "INFRACCION",
  "ACCIDENTE",
  "FALLA_MECANICA",
  "CONDUCTA_CHOFER",
  "OTRO",
];

const INCIDENCIA_TIPO_LABELS = {
  INFRACCION: "infracción",
  ACCIDENTE: "accidente",
  FALLA_MECANICA: "falla mecánica",
  CONDUCTA_CHOFER: "conducta del chofer",
  OTRO: "otro evento",
};

const INCIDENCIA_ESTADOS = ["ABIERTA", "EN_REVISION", "CERRADA"];

// Cuantas fotos admite cada tipo de entidad.
const MAX_ADJUNTOS = { REGISTRO: 1, INCIDENCIA: 3 };

const ENTIDADES_ADJUNTO = Object.keys(MAX_ADJUNTOS);

module.exports = {
  INCIDENCIA_TIPOS,
  INCIDENCIA_TIPO_LABELS,
  INCIDENCIA_ESTADOS,
  MAX_ADJUNTOS,
  ENTIDADES_ADJUNTO,
};
