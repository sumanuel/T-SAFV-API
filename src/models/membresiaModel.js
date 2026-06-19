const pool = require("../config/database");
const historyModel = require("./historyModel");

const getMembresiaById = async (membresia_id) => {
  const res = await pool.query(
    "SELECT * FROM membresias WHERE id = $1 LIMIT 1",
    [membresia_id],
  );
  return res.rows[0];
};

const changeMembresiaState = async (
  membresia_id,
  estado,
  motivo,
  cambiado_por_usuario_id,
) => {
  // Insertar registro en historial_estados
  const entry = await historyModel.createHistoryEntry(
    membresia_id,
    "MEMBRESIA",
    estado,
    motivo,
    cambiado_por_usuario_id,
  );
  return entry;
};

module.exports = {
  getMembresiaById,
  changeMembresiaState,
};
