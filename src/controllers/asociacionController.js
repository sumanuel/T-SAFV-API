const asociacionModel = require("../models/asociacionModel");
const exportModel = require("../models/exportModel");

const create = async (req, res) => {
  const datosAsociacion = req.body;
  const adminId = req.user.id; // ID del usuario autenticado desde el middleware

  try {
    const nuevaAsociacion = await asociacionModel.createAsociacion(
      datosAsociacion,
      adminId,
    );
    res.status(201).json(nuevaAsociacion);
  } catch (error) {
    if (error.code === "ADMIN_ASSOCIATION_EXISTS") {
      return res.status(409).json({
        message: "Cada administrador solo puede crear una asociación.",
      });
    }
    // Manejo de errores específicos, como RIF duplicado
    if (error.code === "23505" && error.constraint === "asociaciones_rif_key") {
      return res.status(409).json({ message: "El RIF ya está registrado." });
    }
    res
      .status(500)
      .json({ message: "Error creating association", error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updated = await asociacionModel.updateAssociation(
      req.params.asociacion_id,
      req.body,
    );

    if (!updated) {
      return res.status(404).json({ message: "Association not found" });
    }

    res.json(updated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating association", error: error.message });
  }
};

const listMine = async (req, res) => {
  try {
    const rows = await asociacionModel.getUserAssociations(req.user.id);
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listing associations", error: error.message });
  }
};

const listMembers = async (req, res) => {
  try {
    const rows = await exportModel.getMiembrosByAsociacion(
      req.params.asociacion_id,
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Error listing association members",
      error: error.message,
    });
  }
};

const createMember = async (req, res) => {
  try {
    const row = await asociacionModel.createAssociationMember(
      req.params.asociacion_id,
      req.body,
      req.user.id,
    );
    res.status(201).json(row);
  } catch (error) {
    if (error.code === "MEMBER_EXISTS") {
      return res
        .status(409)
        .json({ message: "El miembro ya pertenece a esta asociación." });
    }
    res
      .status(500)
      .json({ message: "Error creating member", error: error.message });
  }
};

const updateMember = async (req, res) => {
  try {
    const row = await asociacionModel.updateAssociationMember(
      req.params.asociacion_id,
      req.params.membresia_id,
      req.body,
    );
    if (!row) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.json(row);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating member", error: error.message });
  }
};

const listUnits = async (req, res) => {
  try {
    const rows = await exportModel.getUnidadesByAsociacion(
      req.params.asociacion_id,
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Error listing association units",
      error: error.message,
    });
  }
};

const listTraceability = async (req, res) => {
  try {
    const rows = await exportModel.getTrazabilidadByAsociacion(
      req.params.asociacion_id,
      req.query.fecha_inicio,
      req.query.fecha_fin,
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Error listing association traceability",
      error: error.message,
    });
  }
};

const listPayments = async (req, res) => {
  try {
    const rows = await asociacionModel.listAssociationPayments(
      req.params.asociacion_id,
    );
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listing payments", error: error.message });
  }
};

const createPayment = async (req, res) => {
  try {
    const row = await asociacionModel.createAssociationPayment(
      req.params.asociacion_id,
      req.body,
      req.user.id,
    );
    res.status(201).json(row);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating payment", error: error.message });
  }
};

module.exports = {
  create,
  update,
  listMine,
  listMembers,
  createMember,
  updateMember,
  listUnits,
  listTraceability,
  listPayments,
  createPayment,
};
