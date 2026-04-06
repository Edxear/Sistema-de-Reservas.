const NursingInitiative = require('../models/NursingInitiative');
const NursingChecklist = require('../models/NursingChecklist');
const NursingIncident = require('../models/NursingIncident');
const NursingConfig = require('../models/NursingConfig');
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

const DEFAULT_THRESHOLDS = {
  eventosPor1000: { greenMax: 5, yellowMax: 10 },
  respuestaMin: { greenMax: 15, yellowMax: 45 },
  cumplimientoChecklistPct: { yellowMin: 85, greenMin: 95 },
  ausentismoPct: { greenMax: 5, yellowMax: 10 },
  adherenciaCapacitacionPct: { yellowMin: 80, greenMin: 92 },
};

const HIERARCHY_LEVEL = {
  jefatura: 1,
  subjefatura: 2,
  coordinacion: 3,
  senior: 4,
  asistencial: 5,
};

const getAuthUserId = (req) => req.user?.id || req.user?._id;
const isAdminRole = (role) => ['admin', 'superadmin'].includes(String(role || '').toLowerCase());
const isNursingRole = (role) => ['enfermero', 'admin', 'superadmin'].includes(String(role || '').toLowerCase());

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getWindowDate = (days = 30) => {
  const now = new Date();
  const start = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  return { now, start };
};

const normalize = (value = '') => String(value).trim().toLowerCase();
const normalizeNoAccents = (value = '') => normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const roleFromActor = (actor) => normalize(actor?.rol);
const cargoFromActor = (actor) => normalizeNoAccents(actor?.cargoOrganigrama);
const areaFromActor = (actor) => normalizeNoAccents(actor?.areaOrganigrama);
const branchFromActor = (actor) => String(actor?.ramaEnfermeria || actor?.sectorOrganigrama || '').trim();

const isPrincipalAdmin = (actor) => Boolean(actor?.esSuperAdminPrincipal);

const deriveNursingHierarchy = (actor) => {
  const explicit = normalize(actor?.rolJerarquicoEnfermeria);
  if (HIERARCHY_LEVEL[explicit]) return explicit;

  const cargo = cargoFromActor(actor);
  if (cargo.includes('jef')) return 'jefatura';
  if (cargo.includes('subjef')) return 'subjefatura';
  if (cargo.includes('coordin')) return 'coordinacion';
  if (cargo.includes('senior') || cargo.includes('referente')) return 'senior';
  return 'asistencial';
};

const buildScope = (actor) => {
  const role = roleFromActor(actor);
  if (isPrincipalAdmin(actor) || isAdminRole(role)) {
    return { global: true, rama: '' };
  }

  if (role !== 'enfermero') {
    return { global: false, rama: '' };
  }

  const hierarchy = deriveNursingHierarchy(actor);
  if (['jefatura', 'subjefatura'].includes(hierarchy)) {
    return { global: true, rama: '' };
  }

  return { global: false, rama: branchFromActor(actor) };
};

const canOperateBranch = (scope, branch) => {
  if (scope.global) return true;
  if (!scope.rama) return false;
  return normalizeNoAccents(scope.rama) === normalizeNoAccents(branch);
};

const buildPermissions = (actor) => {
  const role = roleFromActor(actor);
  const hierarchy = deriveNursingHierarchy(actor);
  const principal = isPrincipalAdmin(actor);
  const admin = isAdminRole(role);
  const nursing = isNursingRole(role);

  if (principal) {
    return {
      canViewModule: true,
      canCreateChecklist: true,
      canCreateIncident: true,
      canManageIncidentStatus: true,
      canManageInitiatives: true,
      canConfigureThresholds: true,
      nursingHierarchy: 'principal',
    };
  }

  return {
    canViewModule: nursing,
    canCreateChecklist: nursing,
    canCreateIncident: nursing,
    canManageIncidentStatus: admin || ['jefatura', 'subjefatura', 'coordinacion', 'senior'].includes(hierarchy),
    canManageInitiatives: admin || ['jefatura', 'subjefatura', 'coordinacion'].includes(hierarchy),
    canConfigureThresholds: admin,
    nursingHierarchy: hierarchy,
  };
};

const requirePermission = (res, permissions, key, message) => {
  if (!permissions?.[key]) {
    res.status(403).json({ message });
    return false;
  }
  return true;
};

const ensureConfig = async () => {
  let config = await NursingConfig.findOne({ code: 'default' });
  if (!config) {
    config = await NursingConfig.create({ code: 'default', thresholds: DEFAULT_THRESHOLDS });
  }
  return config;
};

const statusByLessIsBetter = (value, cfg) => {
  if (value <= Number(cfg.greenMax)) return 'green';
  if (value <= Number(cfg.yellowMax)) return 'yellow';
  return 'red';
};

const statusByMoreIsBetter = (value, cfg) => {
  if (value >= Number(cfg.greenMin)) return 'green';
  if (value >= Number(cfg.yellowMin)) return 'yellow';
  return 'red';
};

const mergeThresholds = (input = {}) => ({
  eventosPor1000: {
    greenMax: Number(input?.eventosPor1000?.greenMax ?? DEFAULT_THRESHOLDS.eventosPor1000.greenMax),
    yellowMax: Number(input?.eventosPor1000?.yellowMax ?? DEFAULT_THRESHOLDS.eventosPor1000.yellowMax),
  },
  respuestaMin: {
    greenMax: Number(input?.respuestaMin?.greenMax ?? DEFAULT_THRESHOLDS.respuestaMin.greenMax),
    yellowMax: Number(input?.respuestaMin?.yellowMax ?? DEFAULT_THRESHOLDS.respuestaMin.yellowMax),
  },
  cumplimientoChecklistPct: {
    yellowMin: Number(input?.cumplimientoChecklistPct?.yellowMin ?? DEFAULT_THRESHOLDS.cumplimientoChecklistPct.yellowMin),
    greenMin: Number(input?.cumplimientoChecklistPct?.greenMin ?? DEFAULT_THRESHOLDS.cumplimientoChecklistPct.greenMin),
  },
  ausentismoPct: {
    greenMax: Number(input?.ausentismoPct?.greenMax ?? DEFAULT_THRESHOLDS.ausentismoPct.greenMax),
    yellowMax: Number(input?.ausentismoPct?.yellowMax ?? DEFAULT_THRESHOLDS.ausentismoPct.yellowMax),
  },
  adherenciaCapacitacionPct: {
    yellowMin: Number(input?.adherenciaCapacitacionPct?.yellowMin ?? DEFAULT_THRESHOLDS.adherenciaCapacitacionPct.yellowMin),
    greenMin: Number(input?.adherenciaCapacitacionPct?.greenMin ?? DEFAULT_THRESHOLDS.adherenciaCapacitacionPct.greenMin),
  },
});

const getActorContext = async (req) => {
  const actor = await User.findById(getAuthUserId(req)).select(
    'rol esSuperAdminPrincipal ramaEnfermeria rolJerarquicoEnfermeria cargoOrganigrama areaOrganigrama sectorOrganigrama nombre',
  );
  const permissions = buildPermissions(actor);
  const scope = buildScope(actor);
  return { actor, permissions, scope };
};

exports.getNursingCatalog = async (req, res) => {
  const { permissions, scope } = await getActorContext(req);
  if (!requirePermission(res, permissions, 'canViewModule', 'No autorizado para acceder a enfermeria')) return;
  return res.json({ branches: BRANCHES, hierarchy: HIERARCHY, permissions, scope });
};

exports.getNursingConfig = async (req, res) => {
  try {
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canViewModule', 'No autorizado para ver configuracion de enfermeria')) return;

    const config = await ensureConfig();
    return res.json({ thresholds: config.thresholds || DEFAULT_THRESHOLDS, permissions, scope });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo configuracion de enfermeria', error });
  }
};

exports.updateNursingConfig = async (req, res) => {
  try {
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canConfigureThresholds', 'Solo administracion puede actualizar umbrales')) return;

    const thresholds = mergeThresholds(req.body?.thresholds || {});
    const updated = await NursingConfig.findOneAndUpdate(
      { code: 'default' },
      { $set: { thresholds, updatedBy: getAuthUserId(req) } },
      { new: true, upsert: true },
    );

    await logAuditEvent(req, {
      action: 'nursing.config.update',
      resourceType: 'NursingConfig',
      resourceId: updated._id,
      details: 'Actualizacion de umbrales de semaforo',
    });

    return res.json({ thresholds: updated.thresholds, permissions, scope });
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando configuracion de enfermeria', error });
  }
};

exports.listInitiatives = async (req, res) => {
  try {
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canViewModule', 'No autorizado para acceder a iniciativas de enfermeria')) return;

    const { categoria, rama, estado } = req.query;
    const filter = { activo: true };
    if (categoria) filter.categoria = categoria;
    if (rama) filter.rama = rama;
    if (estado) filter.estado = estado;

    if (!scope.global && scope.rama) {
      filter.$or = [{ rama: scope.rama }, { rama: 'general' }];
    }

    const items = await NursingInitiative.find(filter).sort({ prioridad: -1, createdAt: -1 }).limit(300);

    return res.json({ items, permissions, scope });
  } catch (error) {
    return res.status(500).json({ message: 'Error listando iniciativas de enfermeria', error });
  }
};

exports.createInitiative = async (req, res) => {
  try {
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canManageInitiatives', 'No autorizado para crear iniciativas de enfermeria')) return;

    const ramaTarget = String(req.body?.rama || 'general').trim();
    if (!scope.global && !canOperateBranch(scope, ramaTarget)) {
      return res.status(403).json({ message: 'Solo puedes crear iniciativas para tu rama de enfermeria' });
    }

    const payload = {
      titulo: String(req.body?.titulo || '').trim(),
      descripcion: String(req.body?.descripcion || '').trim(),
      categoria: req.body?.categoria,
      rama: ramaTarget,
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
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canManageInitiatives', 'No autorizado para actualizar iniciativas de enfermeria')) return;

    const current = await NursingInitiative.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Iniciativa no encontrada' });

    if (!scope.global && !canOperateBranch(scope, current.rama)) {
      return res.status(403).json({ message: 'Solo puedes gestionar iniciativas de tu rama de enfermeria' });
    }

    const patch = {};
    const keys = ['titulo', 'descripcion', 'categoria', 'rama', 'prioridad', 'estado', 'responsable', 'fechaObjetivo', 'activo'];
    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) patch[key] = req.body[key];
    });

    if (!scope.global && patch.rama && !canOperateBranch(scope, patch.rama)) {
      return res.status(403).json({ message: 'No puedes mover iniciativas fuera de tu rama de enfermeria' });
    }

    patch.updatedBy = getAuthUserId(req);

    const updated = await NursingInitiative.findByIdAndUpdate(req.params.id, patch, { new: true });

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
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canViewModule', 'No autorizado para ver checklists de enfermeria')) return;

    const { rama, desde, hasta } = req.query;
    const filter = {};
    if (rama) filter.rama = rama;
    if (desde || hasta) {
      filter.fecha = {};
      if (desde) filter.fecha.$gte = new Date(`${desde}T00:00:00`);
      if (hasta) filter.fecha.$lte = new Date(`${hasta}T23:59:59`);
    }

    if (!scope.global && scope.rama) {
      filter.rama = scope.rama;
    }

    const items = await NursingChecklist.find(filter)
      .sort({ fecha: -1, createdAt: -1 })
      .limit(250)
      .populate('createdBy', 'nombre rol');

    return res.json({ items, permissions, scope });
  } catch (error) {
    return res.status(500).json({ message: 'Error listando checklists de enfermeria', error });
  }
};

exports.createChecklist = async (req, res) => {
  try {
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canCreateChecklist', 'No autorizado para crear checklists de enfermeria')) return;

    const ramaTarget = String(req.body?.rama || '').trim();
    if (!scope.global && !canOperateBranch(scope, ramaTarget)) {
      return res.status(403).json({ message: 'Solo puedes registrar checklist en tu rama de enfermeria' });
    }

    const payload = {
      rama: ramaTarget,
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
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canViewModule', 'No autorizado para ver incidentes de enfermeria')) return;

    const { rama, estado, severidad } = req.query;
    const filter = {};
    if (rama) filter.rama = rama;
    if (estado) filter.estado = estado;
    if (severidad) filter.severidad = severidad;

    if (!scope.global && scope.rama) {
      filter.rama = scope.rama;
    }

    const items = await NursingIncident.find(filter)
      .sort({ createdAt: -1 })
      .limit(300)
      .populate('createdBy', 'nombre rol')
      .populate('resolvedBy', 'nombre rol');

    return res.json({ items, permissions, scope });
  } catch (error) {
    return res.status(500).json({ message: 'Error listando incidentes de enfermeria', error });
  }
};

exports.createIncident = async (req, res) => {
  try {
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canCreateIncident', 'No autorizado para crear incidentes de enfermeria')) return;

    const ramaTarget = String(req.body?.rama || '').trim();
    if (!scope.global && !canOperateBranch(scope, ramaTarget)) {
      return res.status(403).json({ message: 'Solo puedes registrar incidentes en tu rama de enfermeria' });
    }

    const payload = {
      rama: ramaTarget,
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
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canManageIncidentStatus', 'No autorizado para cambiar estado de incidentes')) return;

    const current = await NursingIncident.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Incidente no encontrado' });

    if (!scope.global && !canOperateBranch(scope, current.rama)) {
      return res.status(403).json({ message: 'Solo puedes gestionar incidentes de tu rama de enfermeria' });
    }

    const { estado, acciones } = req.body || {};
    const patch = {};
    if (estado) patch.estado = estado;
    if (typeof acciones === 'string') patch.acciones = acciones.trim();

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
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canViewModule', 'No autorizado para ver organigrama de enfermeria')) return;

    const baseFilter = {
      rol: { $in: ['enfermero', 'admin', 'superadmin'] },
      areaOrganigrama: { $regex: /^enfermeria$/i },
    };

    if (!scope.global && scope.rama) {
      baseFilter.ramaEnfermeria = scope.rama;
    }

    const staff = await User.find(baseFilter)
      .select('_id nombre email telefono rol cargoOrganigrama sectorOrganigrama ramaEnfermeria rolJerarquicoEnfermeria');

    const branchesToShow = scope.global ? BRANCHES : BRANCHES.filter((branch) => canOperateBranch(scope, branch));

    const byBranch = branchesToShow.map((branch) => ({
      rama: branch,
      personal: staff.filter((u) => normalizeNoAccents(u.ramaEnfermeria || u.sectorOrganigrama || '') === normalizeNoAccents(branch)),
    }));

    return res.json({ hierarchy: HIERARCHY, branches: branchesToShow, byBranch, total: staff.length, permissions, scope });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo organigrama de enfermeria', error });
  }
};

exports.getNursingDashboard = async (req, res) => {
  try {
    const { permissions, scope } = await getActorContext(req);
    if (!requirePermission(res, permissions, 'canViewModule', 'No autorizado para ver dashboard de enfermeria')) return;

    const config = await ensureConfig();
    const thresholds = mergeThresholds(config.thresholds || DEFAULT_THRESHOLDS);

    const days = clamp(Number(req.query?.days || 30), 7, 120);
    const { start } = getWindowDate(days);

    const checklistFilter = { fecha: { $gte: start } };
    const incidentFilter = { createdAt: { $gte: start } };
    const initiativeFilter = { activo: true };

    if (!scope.global && scope.rama) {
      checklistFilter.rama = scope.rama;
      incidentFilter.rama = scope.rama;
      initiativeFilter.$or = [{ rama: scope.rama }, { rama: 'general' }];
    }

    const [checklists, incidents, initiatives] = await Promise.all([
      NursingChecklist.find(checklistFilter).sort({ fecha: -1 }).limit(800),
      NursingIncident.find(incidentFilter).sort({ createdAt: -1 }).limit(800),
      NursingInitiative.find(initiativeFilter).sort({ prioridad: -1, createdAt: -1 }).limit(500),
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

    const semaforoGlobal = {
      eventosAdversosPor1000PacientesDia: statusByLessIsBetter(eventsPer1000, thresholds.eventosPor1000),
      tiempoRespuestaAlertasMin: statusByLessIsBetter(avgResponseMin, thresholds.respuestaMin),
      cumplimientoChecklistPct: statusByMoreIsBetter(checklistCompliance, thresholds.cumplimientoChecklistPct),
      ausentismoPct: statusByLessIsBetter(absenteeismPct, thresholds.ausentismoPct),
      adherenciaCapacitacionPct: statusByMoreIsBetter(trainingAdherence, thresholds.adherenciaCapacitacionPct),
    };

    const severityRank = { green: 1, yellow: 2, red: 3 };
    const overallBranchColor = (...statuses) => {
      const max = statuses.reduce((acc, s) => Math.max(acc, severityRank[s] || 1), 1);
      return Object.keys(severityRank).find((k) => severityRank[k] === max) || 'green';
    };

    const branchesToShow = scope.global ? BRANCHES : BRANCHES.filter((branch) => canOperateBranch(scope, branch));

    const byBranch = branchesToShow.map((rama) => {
      const branchChecklist = checklists.filter((c) => normalizeNoAccents(c.rama) === normalizeNoAccents(rama));
      const branchIncidents = incidents.filter((i) => normalizeNoAccents(i.rama) === normalizeNoAccents(rama));
      const branchPatientDays = branchChecklist.reduce((sum, c) => sum + Number(c.pacientesAtendidos || 0), 0);
      const eventosPor1000 = branchPatientDays > 0
        ? Number(((branchIncidents.length / branchPatientDays) * 1000).toFixed(2))
        : 0;
      const cumplimiento = branchChecklist.length
        ? Number((branchChecklist.reduce((acc, c) => acc + Number(c.cumplimientoProtocolos || 0), 0) / branchChecklist.length).toFixed(1))
        : 0;

      const semaforoEventos = statusByLessIsBetter(eventosPor1000, thresholds.eventosPor1000);
      const semaforoCumplimiento = statusByMoreIsBetter(cumplimiento, thresholds.cumplimientoChecklistPct);

      return {
        rama,
        incidentes: branchIncidents.length,
        cumplimientoProtocolos: cumplimiento,
        alertasCriticas: branchChecklist.reduce((sum, c) => sum + Number(c.alertasCriticas || 0), 0),
        eventosPor1000,
        semaforo: overallBranchColor(semaforoEventos, semaforoCumplimiento),
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
      thresholds,
      permissions,
      scope,
      semaforoGlobal,
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
