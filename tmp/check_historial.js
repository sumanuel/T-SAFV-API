const pool = require("../src/config/database");

(async () => {
  try {
    const res = await pool.query(
      "SELECT * FROM historial_estados WHERE entidad_tipo = $1 AND entidad_id = $2 ORDER BY id DESC LIMIT 10",
      ["MEMBRESIA", 3],
    );
    if (res.rows.length === 0) {
      console.log(
        "No se encontraron entradas en historial_estados para membresia id 3",
      );
    } else {
      console.log("Entradas encontradas:");
      console.log(JSON.stringify(res.rows, null, 2));
    }
  } catch (err) {
    console.error("Error consultando historial_estados:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
