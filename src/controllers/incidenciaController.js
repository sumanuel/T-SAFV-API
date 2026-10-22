const incidenciaModel = require("../models/incidenciaModel");
const adjuntoModel = require("../models/adjuntoModel");
const { notifyUser } = require("../services/notificationService");
const {
  resolveRoleInAssociation,
  canViewEntity,
} = require("../services/accessService");
const { INCIDENCIA_TIPO_LABELS } = require("../constants/incidencias");
const { resolveCaptureTime } = require("../utils/captureTime");

const withAttachments = async (incidencias) => {
  try {
    const adjuntos = await adjuntoModel.listByEntities(
      "INCIDENCIA",
      incidencias.map((incidencia) => Number(incidencia.id)),
    );
    return incidencias.map((incidencia) => ({
      ...incidencia,
      adjuntos: adjuntos.filter(
        (adjunto) => String(adjunto.entidad_id) === String(incidencia.id),
      ),
    }));
  } catch (error) {
    // Si la migracion 0011 aun no esta aplicada, las incidencias se listan igual.
    console.error("No se pudieron cargar las fotos:", error.message);
    return incidencias.map((incidencia) => ({ ...incidencia, adjuntos: [] }));
  }
};

const notifyOwner = async (incidenciaId) => {
  try {
    const incidencia = await incidenciaModel.findById(incidenciaId);
    if (!incidencia?.propietario_id) return;
    const unitLabel =
      incidencia.numero_unidad ||
      incidencia.placa ||
      `Unidad #${incidencia.unidad_id}`;
    await notifyUser(incidencia.propietario_id, {
      tipo: "incidencia",
      title: "Incidencia registrada",
      body: `Se registró una ${INCIDENCIA_TIPO_LABELS[incidencia.tipo] || "incidencia"} en tu unidad ${unitLabel}.`,
      data: {
        incidencia_id: incidencia.id,
        unidad_id: incidencia.unidad_id,
        asociacion_id: incidencia.asociacion_id,
      },
    });
  } catch (error) {
    console.error("Error notificando la incidencia al propietario:", error.message);
  }
};

const create = async (req, res) => {
  const {
    asociacion_id,
    unidad_id,
    registro_id,
    tipo,
    descripcion,
    lugar,
    fecha_hora_evento,
    client_request_id,
  } = req.body;

  try {
    if (
      unidad_id &&
      !(await incidenciaModel.unidadPerteneceAAsociacion(unidad_id, asociacion_id))
    ) {
      return res
        .status(400)
        .json({ message: "La unidad no pertenece a la asociación" });
    }
    if (
      registro_id &&
      !(await incidenciaModel.registroPerteneceAAsociacion(
        registro_id,
        asociacion_id,
      ))
    ) {
      return res
        .status(400)
        .json({ message: "La fiscalización no pertenece a la asociación" });
    }

    const { incidencia, duplicate } = await incidenciaModel.create({
      asociacionId: asociacion_id,
      unidadId: unidad_id,
      registroId: registro_id,
      tipo,
      descripcion: descripcion.trim(),
      lugar,
      fechaHoraEvento: resolveCaptureTime(fecha_hora_evento),
      reportadaPor: req.user.id,
      clientRequestId: client_request_id,
    });

    // Un reintento no vuelve a avisar al propietario.
    if (!duplicate && incidencia.unidad_id) await notifyOwner(incidencia.id);

    res.status(duplicate ? 200 : 201).json(incidencia);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creando la incidencia", error: error.message });
  }
};

const listByAssociation = async (req, res) => {
  const asociacionId = Number(req.params.asociacion_id);
  const { estado, tipo, unidad_id, fecha_inicio, fecha_fin, limit, offset } =
    req.query;

  try {
    const role = await resolveRoleInAssociation(req.user.id, asociacionId);
    if (!role) {
      return res
        .status(403)
        .json({ message: "Forbidden: Members only for this association" });
    }

    const rows = await incidenciaModel.list({
      asociacionId,
      propietarioId: role === "PROPIETARIO" ? req.user.id : undefined,
      estado,
      tipo,
      unidadId: unidad_id ? Number(unidad_id) : undefined,
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
      limit: Math.min(Number(limit) || 100, 200),
      offset: Number(offset) || 0,
    });
    res.json(await withAttachments(rows));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listando incidencias", error: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const incidencia = await incidenciaModel.findById(Number(req.params.id));
    if (!incidencia) {
      return res.status(404).json({ message: "Incidencia no encontrada" });
    }

    const role = await resolveRoleInAssociation(
      req.user.id,
      incidencia.asociacion_id,
    );
    if (!canViewEntity({ role, userId: req.user.id, entity: incidencia })) {
      return res.status(403).json({ message: "No tienes acceso a esta incidencia" });
    }

    const [withPhotos] = await withAttachments([incidencia]);
    res.json(withPhotos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error cargando la incidencia", error: error.message });
  }
};

const updateEstado = async (req, res) => {
  try {
    const incidencia = await incidenciaModel.findById(Number(req.params.id));
    if (!incidencia) {
      return res.status(404).json({ message: "Incidencia no encontrada" });
    }

    const role = await resolveRoleInAssociation(
      req.user.id,
      incidencia.asociacion_id,
    );
    if (role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Solo un administrador puede cambiar el estado" });
    }

    const updated = await incidenciaModel.updateEstado(
      incidencia.id,
      req.body.estado,
      req.user.id,
    );
    res.json(updated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error actualizando la incidencia", error: error.message });
  }
};

module.exports = { create, listByAssociation, getOne, updateEstado };
