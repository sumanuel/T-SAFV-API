const pool = require("../config/database");
const { notifyUser } = require("../services/notificationService");

const findActiveUnidadesByAsociacion = async (asociacion_id) => {
  const res = await pool.query(
    `SELECT u.*, he.estado as ultimo_estado FROM unidades_transporte u
     LEFT JOIN (
       SELECT DISTINCT ON (entidad_id) entidad_id, estado
       FROM historial_estados
       WHERE entidad_tipo='UNIDAD'
       ORDER BY entidad_id, created_at DESC
     ) he ON he.entidad_id = u.id
     WHERE u.asociacion_id = $1
     AND (he.estado IS NULL OR he.estado <> 'INACTIVO')`,
    [asociacion_id],
  );
  return res.rows;
};

const createRegistroFiscalizacion = async (
  unidad_id,
  fiscal_id,
  asociacion_id,
  chofer,
  origen,
  destino,
  pasajeros,
  fecha_hora_registro,
  { clientRequestId } = {},
) => {
  const fiscalProfileRes = await pool.query(
    `SELECT punto_control
     FROM fiscales
     WHERE asociacion_id = $1 AND usuario_id = $2
     LIMIT 1`,
    [asociacion_id, fiscal_id],
  );
  const punto_control = fiscalProfileRes.rows[0]?.punto_control || null;

  const values = [
    unidad_id,
    fiscal_id,
    asociacion_id,
    chofer,
    origen,
    destino,
    pasajeros,
    fecha_hora_registro,
    punto_control,
  ];
  const columns =
    "unidad_id, fiscal_id, asociacion_id, chofer, origen, destino, pasajeros, fecha_hora_registro, punto_control";

  let registro = null;

  if (clientRequestId) {
    try {
      const inserted = await pool.query(
        `INSERT INTO registros_fiscalizacion (${columns}, client_request_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (fiscal_id, client_request_id) WHERE client_request_id IS NOT NULL
         DO NOTHING RETURNING *`,
        [...values, clientRequestId],
      );
      registro = inserted.rows[0] || null;

      if (!registro) {
        // Reintento de un registro ya guardado: se devuelve el original y no
        // se vuelve a notificar al propietario.
        const existing = await pool.query(
          `SELECT * FROM registros_fiscalizacion
           WHERE fiscal_id = $1 AND client_request_id = $2`,
          [fiscal_id, clientRequestId],
        );
        return { registro: existing.rows[0], duplicate: true };
      }
    } catch (error) {
      // 42703 columna inexistente / 42P10 sin indice unico: la migracion 0010
      // aun no se aplico; se guarda sin idempotencia en vez de fallar.
      if (error.code !== "42703" && error.code !== "42P10") throw error;
      registro = null;
    }
  }

  if (!registro) {
    const res = await pool.query(
      `INSERT INTO registros_fiscalizacion (${columns})
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      values,
    );
    registro = res.rows[0];
  }

  // Notificar al propietario de la unidad
  try {
    const ownerRes = await pool.query(
      `SELECT ut.propietario_id, ut.placa, ut.numero_unidad
       FROM unidades_transporte ut
       WHERE ut.id = $1 LIMIT 1`,
      [unidad_id],
    );
    const owner = ownerRes.rows[0];
    if (owner?.propietario_id) {
      const unitLabel =
        owner.numero_unidad || owner.placa || `Unidad #${unidad_id}`;
      const puntoControlText = punto_control
        ? ` Punto de control: ${punto_control}.`
        : "";
      await notifyUser(owner.propietario_id, {
        tipo: "fiscalizacion",
        title: "Unidad fiscalizada",
        body: `Tu unidad ${unitLabel} fue registrada. Destino: ${destino || "no indicado"}.${puntoControlText}`,
        data: {
          registro_id: registro.id,
          unidad_id,
          asociacion_id,
          punto_control,
        },
      });
    }
  } catch (notifErr) {
    console.error(
      "Error enviando notificación al propietario:",
      notifErr.message,
    );
  }

  return { registro, duplicate: false };
};

module.exports = {
  findActiveUnidadesByAsociacion,
  createRegistroFiscalizacion,
};
