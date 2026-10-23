// Purga de fotos segun la politica de conservacion (PLAN-002 §6).
//
//   node scripts/purgar_adjuntos.js            -> solo informa que borraria
//   node scripts/purgar_adjuntos.js --aplicar  -> borra el contenido
//
// Variables de entorno (opcionales; 0 = no purgar ese tipo):
//   RETENCION_DIAS_FOTO_REGISTRO      dias que se guarda la foto de una fiscalizacion (90 por defecto)
//   RETENCION_MESES_FOTO_INCIDENCIA   meses tras el cierre de una incidencia (12 por defecto)
require("dotenv").config();
const pool = require("../src/config/database");
const {
  readRetentionConfig,
  purgeExpired,
} = require("../src/services/retentionService");

const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

(async () => {
  try {
    const config = readRetentionConfig();
    if (!config.diasFotoRegistro && !config.mesesFotoIncidencia) {
      console.log("Retencion desactivada (valores en 0): no se borra nada.");
      return;
    }

    const apply = process.argv.includes("--aplicar");
    const result = await purgeExpired({ config, apply });

    for (const [label, part] of [
      ["Fotos de fiscalizaciones", result.registro],
      ["Fotos de incidencias cerradas", result.incidencia],
    ]) {
      if (part) console.log(`${label}: ${part.count} (${mb(part.bytes)} MB)`);
    }
    console.log(
      result.applied
        ? "Purga aplicada."
        : apply
          ? "Nada que purgar."
          : "Simulacion: usa --aplicar para borrar.",
    );
  } catch (error) {
    console.error("Error en la purga:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
