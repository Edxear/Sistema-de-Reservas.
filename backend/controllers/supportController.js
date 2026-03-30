const SupportTicket = require('../models/SupportTicket');

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
      slaRespuestaMin: sla.respuesta,
      slaResolucionMin: sla.resolucion,
      responseDueAt: sla.responseDueAt,
      resolutionDueAt: sla.resolutionDueAt,
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error creando ticket de soporte', error });
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
