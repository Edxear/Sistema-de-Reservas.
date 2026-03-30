const SupportTicket = require('../models/SupportTicket');
const SupportKnowledgeArticle = require('../models/SupportKnowledgeArticle');
const BedUnit = require('../models/BedUnit');
const Teleconsulta = require('../models/Teleconsulta');
const { logAuditEvent } = require('../utils/auditLogger');

const SLA_BY_CRITICIDAD = {
  critico: { respuesta: 15, resolucion: 120 },
  alto: { respuesta: 30, resolucion: 240 },
  medio: { respuesta: 120, resolucion: 1440 },
  bajo: { respuesta: 240, resolucion: 4320 },
};

const getUserId = (req) => req.user?.id || req.user?._id;

const buildSla = (criticidad = 'medio') => {
  const now = new Date();
  const { respuesta, resolucion } = SLA_BY_CRITICIDAD[criticidad] || SLA_BY_CRITICIDAD.medio;
  const responseDueAt = new Date(now.getTime() + respuesta * 60000);
  const resolutionDueAt = new Date(now.getTime() + resolucion * 60000);
  return { respuesta, resolucion, responseDueAt, resolutionDueAt };
};

const inferRouting = ({ criticidad, tipoGestion, modulo }) => {
  const mod = String(modulo || '').toLowerCase();

  if (criticidad === 'critico') {
    return { recommendedLevel: 'L3', confidence: 0.92, routingReason: 'Criticidad critica con potencial impacto asistencial' };
  }

  if (['seguridad', 'continuidad', 'backup'].includes(tipoGestion)) {
    return { recommendedLevel: 'L2', confidence: 0.82, routingReason: 'Tipo de gestion requiere atencion especializada' };
  }

  if (mod.includes('hl7') || mod.includes('fhir') || mod.includes('dicom') || mod.includes('integracion')) {
    return { recommendedLevel: 'L2', confidence: 0.78, routingReason: 'Modulo de integracion tecnica detectado' };
  }

  return { recommendedLevel: 'L1', confidence: 0.7, routingReason: 'Caso apto para mesa de ayuda inicial' };
};

exports.getSupportBlueprint = async (_req, res) => {
  res.json({
    teamStructure: [
      { nivel: 'Soporte L1', objetivo: 'Mesa de ayuda: atencion inicial, accesos, contrasenas y derivacion.' },
      { nivel: 'Soporte L2', objetivo: 'Soporte tecnico especializado en sistema clinico, configuracion e integraciones.' },
      { nivel: 'Soporte L3', objetivo: 'Desarrollo/proveedor para bugs, parches y cambios estructurales.' },
      { nivel: 'Coordinador', objetivo: 'Gobierno de SLA, priorizacion y comunicacion con stakeholders.' },
    ],
    processMatrix: [
      { proceso: 'Gestion de incidentes', foco: 'Criticidad y tiempos por impacto clinico.' },
      { proceso: 'Gestion de cambios', foco: 'Testing en entorno aislado antes de produccion.' },
      { proceso: 'Gestion de problemas', foco: 'Analisis causa raiz y prevencion de recurrencias.' },
      { proceso: 'Backup y DR', foco: 'Restauracion documentada y simulacros periodicos.' },
      { proceso: 'Seguridad y accesos', foco: 'RBAC, revisiones de acceso y cumplimiento normativo.' },
    ],
    tooling: [
      'Sistema de ticketing con seguimiento y reportes',
      'Monitoreo proactivo de servicios e integraciones (HL7/FHIR/DICOM)',
      'Base de conocimiento operativa',
      'Acceso remoto seguro con MFA',
      'Entornos de pruebas aislados',
    ],
    criticalClinicalAspects: [
      'Integraciones con equipos medicos (HL7/DICOM)',
      'Cobertura 24/7 para modulos criticos',
      'Cumplimiento normativo y trazabilidad',
      'Capacitacion continua',
      'Gestion de identidades (AD/SSO)',
    ],
    mandatoryDocs: [
      'Manual de procedimientos de soporte',
      'Matriz de escalamiento',
      'Inventario de hardware/software',
      'Plan de continuidad operativa',
    ],
  });
};

exports.createSupportTicket = async (req, res) => {
  try {
    const actorId = getUserId(req);
    const {
      titulo,
      descripcion,
      criticidad = 'medio',
      tipoGestion = 'incidente',
      soporteNivel = 'L1',
      areaClinica = '',
      modulo = '',
      impactoClinico = '',
      solicitanteNombre = '',
      solicitanteRol = '',
      solicitanteArea = '',
      requiresChangeValidation = false,
      tags = [],
    } = req.body;

    const sla = buildSla(criticidad);
    const routing = inferRouting({ criticidad, tipoGestion, modulo });
    const suggestedKb = `${String(tipoGestion || 'incidente').toLowerCase()}-${String(modulo || 'general').toLowerCase().replace(/\s+/g, '-')}`;

    const ticket = await SupportTicket.create({
      titulo,
      descripcion,
      criticidad,
      tipoGestion,
      soporteNivel,
      areaClinica,
      modulo,
      impactoClinico,
      solicitante: {
        usuario: actorId,
        nombre: solicitanteNombre,
        rol: solicitanteRol,
        area: solicitanteArea,
      },
      coordinador: actorId,
      requiresChangeValidation,
      changeValidationStatus: requiresChangeValidation ? 'pendiente' : 'no_aplica',
      tags: Array.isArray(tags) ? tags : [],
      kbArticleRef: suggestedKb,
      routingReason: routing.routingReason,
      autoRouting: {
        recommendedLevel: routing.recommendedLevel,
        confidence: routing.confidence,
        routedAt: new Date(),
      },
      slaRespuestaMin: sla.respuesta,
      slaResolucionMin: sla.resolucion,
      responseDueAt: sla.responseDueAt,
      resolutionDueAt: sla.resolutionDueAt,
    });

    await logAuditEvent(req, {
      action: 'support-ticket.create',
      resourceType: 'SupportTicket',
      resourceId: ticket._id,
      details: `autoRouting=${routing.recommendedLevel} confidence=${routing.confidence}`,
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error creando ticket de soporte', error });
  }
};

exports.listKnowledgeArticles = async (req, res) => {
  try {
    const { categoria, estado = 'publicado', q } = req.query;
    const filter = {};
    if (categoria) filter.categoria = categoria;
    if (estado) filter.estado = estado;
    if (q) {
      filter.$or = [
        { titulo: { $regex: q, $options: 'i' } },
        { contenido: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    const items = await SupportKnowledgeArticle.find(filter)
      .populate('autor', 'nombre rol')
      .sort({ updatedAt: -1 })
      .limit(400);

    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Error listando base de conocimiento', error });
  }
};

exports.createKnowledgeArticle = async (req, res) => {
  try {
    const actorId = getUserId(req);
    const { codigo, titulo, contenido, categoria = 'general', tags = [], estado = 'publicado' } = req.body;

    if (!codigo || !titulo || !contenido) {
      return res.status(400).json({ message: 'codigo, titulo y contenido son obligatorios' });
    }

    const existing = await SupportKnowledgeArticle.findOne({ codigo: String(codigo).trim() });

    if (!existing) {
      const created = await SupportKnowledgeArticle.create({
        codigo: String(codigo).trim(),
        titulo: String(titulo).trim(),
        contenido: String(contenido).trim(),
        categoria: String(categoria).trim(),
        tags: Array.isArray(tags) ? tags : [],
        estado,
        version: 1,
        autor: actorId,
      });

      await logAuditEvent(req, {
        action: 'knowledge-article.create',
        resourceType: 'SupportKnowledgeArticle',
        resourceId: created._id,
        details: `codigo=${created.codigo} version=1`,
      });

      return res.status(201).json(created);
    }

    existing.titulo = String(titulo).trim();
    existing.contenido = String(contenido).trim();
    existing.categoria = String(categoria).trim();
    existing.tags = Array.isArray(tags) ? tags : [];
    existing.estado = estado;
    existing.version = (existing.version || 1) + 1;
    existing.autor = actorId;
    await existing.save();

    await logAuditEvent(req, {
      action: 'knowledge-article.version',
      resourceType: 'SupportKnowledgeArticle',
      resourceId: existing._id,
      details: `codigo=${existing.codigo} version=${existing.version}`,
    });

    return res.json(existing);
  } catch (error) {
    return res.status(400).json({ message: 'Error creando/actualizando articulo KB', error });
  }
};

exports.listSupportTickets = async (req, res) => {
  try {
    const { criticidad, estado, soporteNivel, tipoGestion, q } = req.query;
    const filter = {};

    if (criticidad) filter.criticidad = criticidad;
    if (estado) filter.estado = estado;
    if (soporteNivel) filter.soporteNivel = soporteNivel;
    if (tipoGestion) filter.tipoGestion = tipoGestion;
    if (q) {
      filter.$or = [
        { titulo: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    const tickets = await SupportTicket.find(filter)
      .populate('asignadoA', 'nombre rol')
      .populate('coordinador', 'nombre rol')
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error listando tickets', error });
  }
};

exports.updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = getUserId(req);
    const patch = { ...req.body };

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    const editable = [
      'estado', 'criticidad', 'soporteNivel', 'tipoGestion', 'areaClinica', 'modulo', 'impactoClinico',
      'asignadoA', 'coordinador', 'rootCause', 'workaround', 'resolutionNotes', 'changeValidationStatus',
      'requiresChangeValidation', 'tags'
    ];

    for (const key of editable) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        ticket[key] = patch[key];
      }
    }

    if (!ticket.firstResponseAt && ['en_progreso', 'en_espera', 'resuelto', 'cerrado'].includes(ticket.estado)) {
      ticket.firstResponseAt = new Date();
    }

    if (!ticket.resolvedAt && ['resuelto', 'cerrado'].includes(ticket.estado)) {
      ticket.resolvedAt = new Date();
    }

    if (patch.escalarA) {
      ticket.escalationHistory.push({
        fromLevel: ticket.soporteNivel,
        toLevel: patch.escalarA,
        motivo: patch.motivoEscalamiento || 'Escalamiento operativo',
        autor: actorId,
      });
      ticket.soporteNivel = patch.escalarA;
    }

    await ticket.save();

    const updated = await SupportTicket.findById(id)
      .populate('asignadoA', 'nombre rol')
      .populate('coordinador', 'nombre rol');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando ticket', error });
  }
};

exports.submitTicketSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { surveyScore, surveyComment = '' } = req.body;

    if (!Number.isInteger(surveyScore) || surveyScore < 1 || surveyScore > 5) {
      return res.status(400).json({ message: 'El puntaje de satisfaccion debe estar entre 1 y 5' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    ticket.surveyScore = surveyScore;
    ticket.surveyComment = String(surveyComment || '').trim();
    await ticket.save();

    res.json({ message: 'Encuesta guardada', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error guardando encuesta', error });
  }
};

exports.getSupportMetrics = async (_req, res) => {
  try {
    const tickets = await SupportTicket.find({}).select(
      'criticidad estado responseDueAt resolutionDueAt firstResponseAt resolvedAt surveyScore tipoGestion soporteNivel'
    );

    const total = tickets.length;
    const byEstado = { abierto: 0, en_progreso: 0, en_espera: 0, resuelto: 0, cerrado: 0 };
    const byCriticidad = { critico: 0, alto: 0, medio: 0, bajo: 0 };
    const byNivel = { L1: 0, L2: 0, L3: 0 };

    let responseMeasured = 0;
    let responseInSla = 0;
    let resolutionMeasured = 0;
    let resolutionInSla = 0;
    let surveyCount = 0;
    let surveyTotal = 0;

    for (const t of tickets) {
      byEstado[t.estado] = (byEstado[t.estado] || 0) + 1;
      byCriticidad[t.criticidad] = (byCriticidad[t.criticidad] || 0) + 1;
      byNivel[t.soporteNivel] = (byNivel[t.soporteNivel] || 0) + 1;

      if (t.firstResponseAt && t.responseDueAt) {
        responseMeasured += 1;
        if (new Date(t.firstResponseAt) <= new Date(t.responseDueAt)) {
          responseInSla += 1;
        }
      }

      if (t.resolvedAt && t.resolutionDueAt) {
        resolutionMeasured += 1;
        if (new Date(t.resolvedAt) <= new Date(t.resolutionDueAt)) {
          resolutionInSla += 1;
        }
      }

      if (typeof t.surveyScore === 'number') {
        surveyCount += 1;
        surveyTotal += t.surveyScore;
      }
    }

    const responseSlaPct = responseMeasured ? Number(((responseInSla / responseMeasured) * 100).toFixed(2)) : 0;
    const resolutionSlaPct = resolutionMeasured ? Number(((resolutionInSla / resolutionMeasured) * 100).toFixed(2)) : 0;
    const avgSurvey = surveyCount ? Number((surveyTotal / surveyCount).toFixed(2)) : 0;
    const uptimeTarget = 99.9;

    res.json({
      total,
      byEstado,
      byCriticidad,
      byNivel,
      responseSlaPct,
      resolutionSlaPct,
      avgSurvey,
      uptimeTarget,
      reportSummary: [
        `Tickets totales: ${total}`,
        `SLA respuesta: ${responseSlaPct}%`,
        `SLA resolucion: ${resolutionSlaPct}%`,
        `Satisfaccion promedio: ${avgSurvey}/5`,
      ],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo metricas de soporte', error });
  }
};

exports.getAdvancedOperationalAnalytics = async (_req, res) => {
  try {
    const now = new Date();
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [tickets30d, allBeds, teleconsultasProximas] = await Promise.all([
      SupportTicket.find({ createdAt: { $gte: since30d } }).select(
        'estado criticidad responseDueAt resolutionDueAt firstResponseAt resolvedAt soporteNivel createdAt'
      ),
      BedUnit.find({}).select('estado sector updatedAt'),
      Teleconsulta.find({ fechaProgramada: { $gte: now }, estado: { $in: ['programada', 'en_curso'] } }).select('fechaProgramada estado'),
    ]);

    const totalTickets = tickets30d.length;
    const abiertos = tickets30d.filter((t) => ['abierto', 'en_progreso', 'en_espera'].includes(t.estado)).length;
    const criticosAbiertos = tickets30d.filter((t) => t.criticidad === 'critico' && ['abierto', 'en_progreso', 'en_espera'].includes(t.estado)).length;

    const responseMeasured = tickets30d.filter((t) => t.firstResponseAt && t.responseDueAt);
    const responseInSla = responseMeasured.filter((t) => new Date(t.firstResponseAt) <= new Date(t.responseDueAt)).length;
    const responseSla = responseMeasured.length ? Number(((responseInSla / responseMeasured.length) * 100).toFixed(2)) : 0;

    const resolutionMeasured = tickets30d.filter((t) => t.resolvedAt && t.resolutionDueAt);
    const resolutionInSla = resolutionMeasured.filter((t) => new Date(t.resolvedAt) <= new Date(t.resolutionDueAt)).length;
    const resolutionSla = resolutionMeasured.length ? Number(((resolutionInSla / resolutionMeasured.length) * 100).toFixed(2)) : 0;

    const totalBeds = allBeds.length;
    const ocupadas = allBeds.filter((b) => b.estado === 'ocupada').length;
    const ocupacionPct = totalBeds ? Number(((ocupadas / totalBeds) * 100).toFixed(2)) : 0;

    const alerts = [];
    if (responseSla < 85 && totalTickets > 10) {
      alerts.push({
        level: 'alto',
        code: 'SLA_RESPUESTA_RIESGO',
        message: `SLA de respuesta en riesgo (${responseSla}%).`,
      });
    }
    if (resolutionSla < 80 && totalTickets > 10) {
      alerts.push({
        level: 'alto',
        code: 'SLA_RESOLUCION_RIESGO',
        message: `SLA de resolucion en riesgo (${resolutionSla}%).`,
      });
    }
    if (criticosAbiertos >= 5) {
      alerts.push({
        level: 'critico',
        code: 'BACKLOG_CRITICO',
        message: `${criticosAbiertos} tickets criticos abiertos requieren accion inmediata.`,
      });
    }
    if (ocupacionPct >= 90 && totalBeds > 0) {
      alerts.push({
        level: 'alto',
        code: 'OCUPACION_CAMAS_ALTA',
        message: `Ocupacion de camas alta (${ocupacionPct}%).`,
      });
    }
    if (teleconsultasProximas.length >= 15) {
      alerts.push({
        level: 'medio',
        code: 'CARGA_TELECONSULTAS',
        message: `Carga elevada de teleconsultas proximas (${teleconsultasProximas.length}).`,
      });
    }

    return res.json({
      period: { from: since30d, to: now },
      kpis: {
        totalTickets,
        abiertos,
        criticosAbiertos,
        responseSla,
        resolutionSla,
        ocupacionCamasPct: ocupacionPct,
        teleconsultasProximas: teleconsultasProximas.length,
      },
      alerts,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo analitica avanzada', error });
  }
};
