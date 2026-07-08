const pool = require("../config/database");
const { sendPushNotification } = require("../services/notificationService");

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
) => {
  const fiscalProfileRes = await pool.query(
    `SELECT punto_control
     FROM fiscales
     WHERE asociacion_id = $1 AND usuario_id = $2
     LIMIT 1`,
    [asociacion_id, fiscal_id],
  );
  const punto_control = fiscalProfileRes.rows[0]?.punto_control || null;

  const res = await pool.query(
    `INSERT INTO registros_fiscalizacion (unidad_id, fiscal_id, asociacion_id, chofer, origen, destino, pasajeros, fecha_hora_registro, punto_control)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      unidad_id,
      fiscal_id,
      asociacion_id,
      chofer,
      origen,
      destino,
      pasajeros,
      fecha_hora_registro,
      punto_control,
    ],
  );
  const registro = res.rows[0];

  // Notificar al propietario de la unidad
  try {
    const ownerRes = await pool.query(
      `SELECT u.push_token, u.nombre, ut.placa, ut.numero_unidad
       FROM unidades_transporte ut
       JOIN usuarios u ON u.id = ut.propietario_id
       WHERE ut.id = $1 LIMIT 1`,
      [unidad_id],
    );
    const owner = ownerRes.rows[0];
    if (owner?.push_token) {
      const unitLabel =
        owner.numero_unidad || owner.placa || `Unidad #${unidad_id}`;
      await sendPushNotification(
        owner.push_token,
        "Unidad fiscalizada",
        `Tu unidad ${unitLabel} fue registrada. Destino: ${destino || "no indicado"}.`,
        { registro_id: registro.id, unidad_id, asociacion_id },
      );
    }
  } catch (notifErr) {
    console.error(
      "Error enviando notificación al propietario:",
      notifErr.message,
    );
  }

  return registro;
};

module.exports = {
  findActiveUnidadesByAsociacion,
  createRegistroFiscalizacion,
};
