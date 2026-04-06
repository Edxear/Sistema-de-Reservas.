const NursingInitiative = require('../models/NursingInitiative');
const NursingChecklist = require('../models/NursingChecklist');
const NursingIncident = require('../models/NursingIncident');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

const BRANCHES = [
  'Guardia',
  'Internacion Adultos',
  'UTI / Cuidados Criticos',
  'Quirurgica',
  'Pediatrica',
  'Neonatologia',
  'Salud Mental',
  'Vacunatorio',
  'Control de Infecciones',
];

const HIERARCHY = [
  { nivel: 1, cargo: 'Jefatura de Enfermeria', responsabilidad: 'Direccion estrategica y definicion de protocolos.' },
  { nivel: 2, cargo: 'Subjefatura / Coordinacion de Turno', responsabilidad: 'Gestion operativa diaria y cobertura de guardias.' },
  { nivel: 3, cargo: 'Coordinaciones por Rama', responsabilidad: 'Supervision clinica por especialidad y estandares de calidad.' },
  { nivel: 4, cargo: 'Enfermeria Senior', responsabilidad: 'Referente tecnico, tutoria y soporte en casos complejos.' },
  { nivel: 5, cargo: 'Enfermeria Asistencial', responsabilidad: 'Ejecucion de cuidados, registros y continuidad asistencial.' },
];

const getAuthUserId = (req) => req.user?.id || req.user?._id;
const isAdminRole = (role) => ['admin', 'superadmin'].includes(String(role || '').toLowerCase());
const canManageNursing = (role) => ['enfermero', 'admin', 'superadmin'].includes(String(role || '').toLowerCase());

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getWindowDate = (days = 30) => {
  const now = new Date();
  const start = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  return { now, start };
};

exports.getNursingCatalog = async (_req, res) => {
  return res.json({ branches: BRANCHES, hierarchy: HIERARCHY });
};

exports.listInitiatives = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para acceder a iniciativas de enfermeria' });
    }

    const { categoria, rama, estado } = req.query;
    const filter = { activo: true };
    if (categoria) filter.categoria = categoria;
    if (rama) filter.rama = rama;
    if (estado) filter.estado = estado;

    const items = await NursingInitiative.find(filter)
      .sort({ prioridad: -1, createdAt: -1 })
      .limit(300);

    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Error listando iniciativas de enfermeria', error });
  }
};

exports.createInitiative = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para crear iniciativas de enfermeria' });
    }

    const payload = {
      titulo: String(req.body?.titulo || '').trim(),
      descripcion: String(req.body?.descripcion || '').trim(),
      categoria: req.body?.categoria,
      rama: req.body?.rama || 'general',
      prioridad: req.body?.prioridad || 'media',
      estado: req.body?.estado || 'pendiente',
      responsable: String(req.body?.responsable || '').trim(),
      fechaObjetivo: req.body?.fechaObjetivo || null,
      createdBy: getAuthUserId(req),
      updatedBy: getAuthUserId(req),
    };

    if (!payload.titulo || !payload.categoria) {
      return res.status(400).json({ message: 'titulo y categoria son obligatorios' });
    }

    const created = await NursingInitiative.create(payload);

    await logAuditEvent(req, {
      action: 'nursing.initiative.create',
      resourceType: 'NursingInitiative',
      resourceId: created._id,
      details: `categoria=${payload.categoria} rama=${payload.rama}`,
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Error creando iniciativa de enfermeria', error });
  }
};

exports.updateInitiative = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para actualizar iniciativas de enfermeria' });
    }

    const patch = {};
    const keys = ['titulo', 'descripcion', 'categoria', 'rama', 'prioridad', 'estado', 'responsable', 'fechaObjetivo', 'activo'];
    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) patch[key] = req.body[key];
    });
    patch.updatedBy = getAuthUserId(req);

    const updated = await NursingInitiative.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!updated) return res.status(404).json({ message: 'Iniciativa no encontrada' });

    await logAuditEvent(req, {
      action: 'nursing.initiative.update',
      resourceType: 'NursingInitiative',
      resourceId: updated._id,
      details: `estado=${updated.estado}`,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando iniciativa de enfermeria', error });
  }
};

exports.listChecklists = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para ver checklists de enfermeria' });
    }

    const { rama, desde, hasta } = req.query;
    const filter = {};
    if (rama) filter.rama = rama;
    if (desde || hasta) {
      filter.fecha = {};
      if (desde) filter.fecha.$gte = new Date(`${desde}T00:00:00`);
      if (hasta) filter.fecha.$lte = new Date(`${hasta}T23:59:59`);
    }

    const items = await NursingChecklist.find(filter)
      .sort({ fecha: -1, createdAt: -1 })
      .limit(250)
      .populate('createdBy', 'nombre rol');

    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Error listando checklists de enfermeria', error });
  }
};

exports.createChecklist = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para crear checklists de enfermeria' });
    }

    const payload = {
      rama: req.body?.rama,
      turno: req.body?.turno,
      fecha: req.body?.fecha ? new Date(req.body.fecha) : new Date(),
      pacientesAtendidos: clamp(Number(req.body?.pacientesAtendidos || 0), 0, 500),
      dotacionPlanificada: clamp(Number(req.body?.dotacionPlanificada || 0), 0, 200),
      dotacionPresente: clamp(Number(req.body?.dotacionPresente || 0), 0, 200),
      alertasCriticas: clamp(Number(req.body?.alertasCriticas || 0), 0, 200),
      cumplimientoProtocolos: clamp(Number(req.body?.cumplimientoProtocolos || 0), 0, 100),
      adherenciaCapacitacion: clamp(Number(req.body?.adherenciaCapacitacion || 0), 0, 100),
      items: Array.isArray(req.body?.items) ? req.body.items : [],
      observaciones: String(req.body?.observaciones || '').trim(),
      createdBy: getAuthUserId(req),
    };

    if (!payload.rama || !payload.turno) {
      return res.status(400).json({ message: 'rama y turno son obligatorios' });
    }

    const created = await NursingChecklist.create(payload);

    await logAuditEvent(req, {
      action: 'nursing.checklist.create',
      resourceType: 'NursingChecklist',
      resourceId: created._id,
      details: `rama=${payload.rama} turno=${payload.turno}`,
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Error creando checklist de enfermeria', error });
  }
};

exports.listIncidents = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para ver incidentes de enfermeria' });
    }

    const { rama, estado, severidad } = req.query;
    const filter = {};
    if (rama) filter.rama = rama;
    if (estado) filter.estado = estado;
    if (severidad) filter.severidad = severidad;

    const items = await NursingIncident.find(filter)
      .sort({ createdAt: -1 })
      .limit(300)
      .populate('createdBy', 'nombre rol')
      .populate('resolvedBy', 'nombre rol');

    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Error listando incidentes de enfermeria', error });
  }
};

exports.createIncident = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para crear incidentes de enfermeria' });
    }

    const payload = {
      rama: req.body?.rama,
      tipo: req.body?.tipo,
      severidad: req.body?.severidad || 'media',
      estado: 'abierto',
      descripcion: String(req.body?.descripcion || '').trim(),
      pacienteRef: String(req.body?.pacienteRef || '').trim(),
      acciones: String(req.body?.acciones || '').trim(),
      createdBy: getAuthUserId(req),
    };

    if (!payload.rama || !payload.tipo || !payload.descripcion) {
      return res.status(400).json({ message: 'rama, tipo y descripcion son obligatorios' });
    }

    const created = await NursingIncident.create(payload);

    await logAuditEvent(req, {
      action: 'nursing.incident.create',
      resourceType: 'NursingIncident',
      resourceId: created._id,
      details: `rama=${payload.rama} severidad=${payload.severidad}`,
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Error creando incidente de enfermeria', error });
  }
};

exports.updateIncidentStatus = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para actualizar incidentes de enfermeria' });
    }

    const { estado, acciones } = req.body || {};
    const patch = {};
    if (estado) patch.estado = estado;
    if (typeof acciones === 'string') patch.acciones = acciones.trim();

    const current = await NursingIncident.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Incidente no encontrado' });

    if (!current.firstActionAt && (patch.acciones || patch.estado === 'en_investigacion' || patch.estado === 'cerrado')) {
      patch.firstActionAt = new Date();
    }
    if (patch.estado === 'cerrado') {
      patch.closedAt = new Date();
      patch.resolvedBy = getAuthUserId(req);
    }

    const updated = await NursingIncident.findByIdAndUpdate(req.params.id, patch, { new: true });

    await logAuditEvent(req, {
      action: 'nursing.incident.update',
      resourceType: 'NursingIncident',
      resourceId: updated._id,
      details: `estado=${updated.estado}`,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando incidente de enfermeria', error });
  }
};

exports.getNursingOrganigrama = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para ver organigrama de enfermeria' });
    }

    const staff = await User.find({
      rol: { $in: ['enfermero', 'admin', 'superadmin'] },
      areaOrganigrama: { $regex: /^enfermeria$/i },
    }).select('_id nombre email telefono rol cargoOrganigrama sectorOrganigrama ramaEnfermeria');

    const byBranch = BRANCHES.map((branch) => ({
      rama: branch,
      personal: staff.filter((u) => String(u.ramaEnfermeria || u.sectorOrganigrama || '').toLowerCase() === branch.toLowerCase()),
    }));

    return res.json({ hierarchy: HIERARCHY, branches: BRANCHES, byBranch, total: staff.length });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo organigrama de enfermeria', error });
  }
};

exports.getNursingDashboard = async (req, res) => {
  try {
    if (!canManageNursing(req.user?.rol)) {
      return res.status(403).json({ message: 'No autorizado para ver dashboard de enfermeria' });
    }

    const days = clamp(Number(req.query?.days || 30), 7, 120);
    const { start } = getWindowDate(days);

    const [checklists, incidents, initiatives] = await Promise.all([
      NursingChecklist.find({ fecha: { $gte: start } }).sort({ fecha: -1 }).limit(800),
      NursingIncident.find({ createdAt: { $gte: start } }).sort({ createdAt: -1 }).limit(800),
      NursingInitiative.find({ activo: true }).sort({ prioridad: -1, createdAt: -1 }).limit(500),
    ]);

    const patientDays = checklists.reduce((sum, c) => sum + Number(c.pacientesAtendidos || 0), 0);
    const totalIncidents = incidents.length;
    const eventsPer1000 = patientDays > 0 ? Number(((totalIncidents / patientDays) * 1000).toFixed(2)) : 0;

    const responseTimes = incidents
      .filter((i) => i.firstActionAt)
      .map((i) => (new Date(i.firstActionAt).getTime() - new Date(i.createdAt).getTime()) / 60000)
      .filter((v) => v >= 0);
    const avgResponseMin = responseTimes.length
      ? Number((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1))
      : 0;

    const checklistCompliance = checklists.length
      ? Number((checklists.reduce((acc, c) => acc + Number(c.cumplimientoProtocolos || 0), 0) / checklists.length).toFixed(1))
      : 0;

    const trainingAdherence = checklists.length
      ? Number((checklists.reduce((acc, c) => acc + Number(c.adherenciaCapacitacion || 0), 0) / checklists.length).toFixed(1))
      : 0;

    const planned = checklists.reduce((sum, c) => sum + Number(c.dotacionPlanificada || 0), 0);
    const present = checklists.reduce((sum, c) => sum + Number(c.dotacionPresente || 0), 0);
    const absenteeismPct = planned > 0
      ? Number((((planned - present) / planned) * 100).toFixed(1))
      : 0;

    const infections = incidents.filter((i) => i.tipo === 'infecciones').length;

    const byBranch = BRANCHES.map((rama) => {
      const branchChecklist = checklists.filter((c) => c.rama === rama);
      const branchIncidents = incidents.filter((i) => i.rama === rama);
      const branchPatientDays = branchChecklist.reduce((sum, c) => sum + Number(c.pacientesAtendidos || 0), 0);
      return {
        rama,
        incidentes: branchIncidents.length,
        cumplimientoProtocolos: branchChecklist.length
          ? Number((branchChecklist.reduce((acc, c) => acc + Number(c.cumplimientoProtocolos || 0), 0) / branchChecklist.length).toFixed(1))
          : 0,
        alertasCriticas: branchChecklist.reduce((sum, c) => sum + Number(c.alertasCriticas || 0), 0),
        eventosPor1000: branchPatientDays > 0
          ? Number(((branchIncidents.length / branchPatientDays) * 1000).toFixed(2))
          : 0,
      };
    });

    const initiativesSummary = {
      total: initiatives.length,
      pendiente: initiatives.filter((i) => i.estado === 'pendiente').length,
      enProgreso: initiatives.filter((i) => i.estado === 'en_progreso').length,
      implementado: initiatives.filter((i) => i.estado === 'implementado').length,
    };

    return res.json({
      windowDays: days,
      kpis: {
        eventosAdversosPor1000PacientesDia: eventsPer1000,
        tiempoRespuestaAlertasMin: avgResponseMin,
        cumplimientoChecklistPct: checklistCompliance,
        infeccionesAsistenciales: infections,
        ausentismoPct: absenteeismPct,
        adherenciaCapacitacionPct: trainingAdherence,
      },
      initiativesSummary,
      branchSummary: byBranch,
      recentIncidents: incidents.slice(0, 10),
      recentChecklists: checklists.slice(0, 10),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo dashboard de enfermeria', error });
  }
};
