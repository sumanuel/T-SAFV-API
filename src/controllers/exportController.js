const ExcelJS = require("exceljs");
const exportModel = require("../models/exportModel");

const exportMiembros = async (req, res) => {
  const asociacion_id = req.params.asociacion_id;
  try {
    const miembros = await exportModel.getMiembrosByAsociacion(asociacion_id);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Miembros");
    ws.addRow(["ID", "Nombre", "Email", "Rol"]);
    miembros.forEach((m) => ws.addRow([m.id, m.nombre, m.email, m.rol]));
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=miembros_asoc_${asociacion_id}.xlsx`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting miembros", error: error.message });
  }
};

const exportUnidades = async (req, res) => {
  const asociacion_id = req.params.asociacion_id;
  try {
    const unidades = await exportModel.getUnidadesByAsociacion(asociacion_id);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Unidades");
    ws.addRow([
      "ID",
      "Placa",
      "Propietario",
      "Marca",
      "Modelo",
      "Año",
      "UltimoEstado",
    ]);
    unidades.forEach((u) =>
      ws.addRow([
        u.id,
        u.placa,
        u.propietario_id,
        u.marca,
        u.modelo,
        u.ano,
        u.ultimo_estado,
      ]),
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=unidades_asoc_${asociacion_id}.xlsx`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting unidades", error: error.message });
  }
};

const exportTrazabilidad = async (req, res) => {
  const asociacion_id = req.params.asociacion_id;
  const { fecha_inicio, fecha_fin } = req.query;
  try {
    const registros = await exportModel.getTrazabilidadByAsociacion(
      asociacion_id,
      fecha_inicio,
      fecha_fin,
    );
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Trazabilidad");
    ws.addRow([
      "ID",
      "Unidad",
      "Fiscal",
      "Chofer",
      "Destino",
      "Pasajeros",
      "FechaRegistro",
    ]);
    registros.forEach((r) =>
      ws.addRow([
        r.id,
        r.unidad_id,
        r.fiscal_id,
        r.chofer,
        r.destino,
        r.pasajeros,
        r.fecha_hora_registro,
      ]),
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=trazabilidad_asoc_${asociacion_id}.xlsx`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting trazabilidad", error: error.message });
  }
};

module.exports = {
  exportMiembros,
  exportUnidades,
  exportTrazabilidad,
};
