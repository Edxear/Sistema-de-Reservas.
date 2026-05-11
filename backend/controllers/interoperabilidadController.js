const User = require('../models/User');
const HistoriaClinica = require('../models/HistoriaClinica');
const EndpointExterno = require('../models/EndpointExterno');
const TransaccionIntercambio = require('../models/TransaccionIntercambio');
const ConsentimientoInterop = require('../models/ConsentimientoInterop');
const { logAuditEvent } = require('../utils/auditLogger');

const toIsoDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const truncatePayload = (value, limit = 4000) => {
  try {
    const asString = typeof value === 'string' ? value : JSON.stringify(value);
    return String(asString || '').slice(0, limit);
  } catch (_error) {
    return '';
  }
};

const buildReceiver = (req) => String(req.query.receiver || 'interno').trim().toLowerCase();

const hasActiveConsent = async (pacienteId, organismoReceptor) => {
  const now = new Date();
  const consent = await ConsentimientoInterop.findOne({
    paciente: pacienteId,
    organismoReceptor,
    activo: true,
    fechaInicio: { $lte: now },
    fechaFin: { $gte: now },
  });
  return Boolean(consent);
};

const persistInteropTransaction = async ({
  endpointNombre,
  paciente,
  usuarioSolicitante,
  tipoMensaje,
  requestPayload,
  responsePayload,
  estado,
  codigoEstadoHttp,
  error,
}) => {
  try {
    await TransaccionIntercambio.create({
      endpointNombre,
      paciente,
      usuarioSolicitante,
      tipoMensaje,
      requestPayload: truncatePayload(requestPayload),
      responsePayload: truncatePayload(responsePayload),
      estado,
      codigoEstadoHttp,
      error: String(error || '').slice(0, 300),
    });
  } catch (_error) {
    // no-op: la trazabilidad no debe romper la respuesta principal
  }
};

const toFhirPatient = (user) => ({
  resourceType: 'Patient',
  id: String(user._id),
  identifier: user.documento ? [{ system: 'urn:integrasalud:documento', value: user.documento }] : [],
  name: [{ text: user.nombre }],
  telecom: [
    user.telefono ? { system: 'phone', value: user.telefono } : null,
    user.email ? { system: 'email', value: user.email } : null,
  ].filter(Boolean),
  gender: user.genero || 'unknown',
  birthDate: user.fechaNacimiento ? toIsoDate(user.fechaNacimiento)?.slice(0, 10) : undefined,
  address: user.direccion ? [{ text: user.direccion }] : [],
});

const toFhirObservation = (item, pacienteId) => ({
  resourceType: 'Observation',
  id: String(item._id),
  status: 'final',
  category: [{ text: item.tipo || 'evolucion' }],
  code: { text: item.eventCategory || item.tipo || 'evolucion' },
  subject: { reference: `Patient/${pacienteId}` },
  performer: item.medico?.nombre ? [{ display: item.medico.nombre }] : [],
  effectiveDateTime: toIsoDate(item.fecha),
  valueString: item.descripcion,
  note: [
    item.clinicalSnapshot?.diagnostico ? { text: `Diagnostico: ${item.clinicalSnapshot.diagnostico}` } : null,
    item.clinicalSnapshot?.plan ? { text: `Plan: ${item.clinicalSnapshot.plan}` } : null,
  ].filter(Boolean),
});

// ── Endpoints externos ───────────────────────────────────────────────────────

exports.createExternalEndpoint = async (req, res) => {
  try {
    const endpoint = await EndpointExterno.create(req.body);
    await logAuditEvent(req, {
      action: 'interop_endpoint_create',
      resourceType: 'interoperabilidad',
      resourceId: endpoint._id,
      details: `Endpoint externo creado: ${endpoint.nombre}`,
    });
    return res.status(201).json({ ok: true, data: endpoint });
  } catch (_error) {
    return res.status(500).json({ message: 'Error creando endpoint externo' });
  }
};

exports.listExternalEndpoints = async (req, res) => {
  try {
    const { tipo, activo } = req.query;
    const query = {};
    if (tipo) query.tipo = tipo;
    if (activo !== undefined) query.activo = activo === 'true';
    const endpoints = await EndpointExterno.find(query).sort({ createdAt: -1 });
    return res.json({ ok: true, data: endpoints });
  } catch (_error) {
    return res.status(500).json({ message: 'Error listando endpoints externos' });
  }
};

// ── Consentimientos ──────────────────────────────────────────────────────────

exports.upsertConsent = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { organismoReceptor, finalidad, fechaInicio, fechaFin, activo = true } = req.body;

    if (!organismoReceptor || !fechaInicio || !fechaFin) {
      return res.status(400).json({ message: 'organismoReceptor, fechaInicio y fechaFin son obligatorios' });
    }

    const consent = await ConsentimientoInterop.findOneAndUpdate(
      { paciente: pacienteId, organismoReceptor },
      {
        finalidad: finalidad || '',
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        activo: Boolean(activo),
        firmadoPorPaciente: true,
        ipFirma: req.ip || '',
        creadoPor: req.user?._id || req.user?.id || null,
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logAuditEvent(req, {
      action: 'interop_consent_upsert',
      resourceType: 'patient',
      resourceId: pacienteId,
      details: `Consentimiento interoperabilidad actualizado para receptor ${organismoReceptor}`,
    });

    return res.json({ ok: true, data: consent });
  } catch (_error) {
    return res.status(500).json({ message: 'Error actualizando consentimiento de interoperabilidad' });
  }
};

exports.getPatientConsents = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const consents = await ConsentimientoInterop.find({ paciente: pacienteId }).sort({ createdAt: -1 });
    return res.json({ ok: true, data: consents });
  } catch (_error) {
    return res.status(500).json({ message: 'Error obteniendo consentimientos de interoperabilidad' });
  }
};

// ── Trazabilidad de transacciones ────────────────────────────────────────────

exports.listTransactions = async (req, res) => {
  try {
    const { pacienteId, tipoMensaje, estado, limit = 100 } = req.query;
    const query = {};
    if (pacienteId) query.paciente = pacienteId;
    if (tipoMensaje) query.tipoMensaje = tipoMensaje;
    if (estado) query.estado = estado;

    const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    const tx = await TransaccionIntercambio.find(query)
      .populate('paciente', 'nombre email documento')
      .populate('usuarioSolicitante', 'nombre email rol')
      .sort({ fecha: -1 })
      .limit(parsedLimit);

    return res.json({ ok: true, data: tx });
  } catch (_error) {
    return res.status(500).json({ message: 'Error listando transacciones de interoperabilidad' });
  }
};

exports.getFhirPatient = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const receiver = buildReceiver(req);

    if (receiver !== 'interno') {
      const allowed = await hasActiveConsent(pacienteId, receiver);
      if (!allowed) {
        await persistInteropTransaction({
          endpointNombre: receiver,
          paciente: pacienteId,
          usuarioSolicitante: req.user?._id || req.user?.id || null,
          tipoMensaje: 'FHIR_Patient',
          requestPayload: { receiver, pacienteId },
          responsePayload: { message: 'Consentimiento no vigente' },
          estado: 'failed',
          codigoEstadoHttp: 403,
          error: 'Consentimiento no vigente para el receptor solicitado',
        });
        return res.status(403).json({ message: 'Consentimiento no vigente para compartir datos con este receptor' });
      }
    }

    const paciente = await User.findById(pacienteId).select('nombre email telefono documento genero fechaNacimiento direccion alergias rol');

    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const payload = toFhirPatient(paciente);

    await persistInteropTransaction({
      endpointNombre: receiver,
      paciente: pacienteId,
      usuarioSolicitante: req.user?._id || req.user?.id || null,
      tipoMensaje: 'FHIR_Patient',
      requestPayload: { receiver, pacienteId },
      responsePayload: payload,
      estado: 'success',
      codigoEstadoHttp: 200,
    });

    await logAuditEvent(req, {
      action: 'interop_fhir_patient_export',
      resourceType: 'patient',
      resourceId: pacienteId,
      details: `Export FHIR Patient hacia receptor ${receiver}`,
    });

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: 'Error generando recurso FHIR Patient' });
  }
};

exports.getFhirClinicalBundle = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const receiver = buildReceiver(req);

    if (receiver !== 'interno') {
      const allowed = await hasActiveConsent(pacienteId, receiver);
      if (!allowed) {
        await persistInteropTransaction({
          endpointNombre: receiver,
          paciente: pacienteId,
          usuarioSolicitante: req.user?._id || req.user?.id || null,
          tipoMensaje: 'FHIR_Bundle',
          requestPayload: { receiver, pacienteId },
          responsePayload: { message: 'Consentimiento no vigente' },
          estado: 'failed',
          codigoEstadoHttp: 403,
          error: 'Consentimiento no vigente para el receptor solicitado',
        });
        return res.status(403).json({ message: 'Consentimiento no vigente para compartir datos con este receptor' });
      }
    }

    const paciente = await User.findById(pacienteId).select('nombre email telefono documento genero fechaNacimiento direccion alergias rol');

    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const registros = await HistoriaClinica.find({ paciente: pacienteId })
      .populate('medico', 'nombre')
      .sort({ fecha: -1 })
      .limit(200);

    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: toFhirPatient(paciente),
        },
        ...registros.map((item) => ({
          resource: toFhirObservation(item, pacienteId),
        })),
      ],
    };

    await persistInteropTransaction({
      endpointNombre: receiver,
      paciente: pacienteId,
      usuarioSolicitante: req.user?._id || req.user?.id || null,
      tipoMensaje: 'FHIR_Bundle',
      requestPayload: { receiver, pacienteId },
      responsePayload: bundle,
      estado: 'success',
      codigoEstadoHttp: 200,
    });

    await logAuditEvent(req, {
      action: 'interop_fhir_bundle_export',
      resourceType: 'historia_clinica',
      resourceId: pacienteId,
      details: `Export FHIR Bundle clinico hacia receptor ${receiver}`,
    });

    return res.json(bundle);
  } catch (error) {
    return res.status(500).json({ message: 'Error generando bundle clinico FHIR' });
  }
};

exports.getHL7AdtA04 = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const receiver = buildReceiver(req);

    if (receiver !== 'interno') {
      const allowed = await hasActiveConsent(pacienteId, receiver);
      if (!allowed) {
        await persistInteropTransaction({
          endpointNombre: receiver,
          paciente: pacienteId,
          usuarioSolicitante: req.user?._id || req.user?.id || null,
          tipoMensaje: 'HL7_ADT_A04',
          requestPayload: { receiver, pacienteId },
          responsePayload: { message: 'Consentimiento no vigente' },
          estado: 'failed',
          codigoEstadoHttp: 403,
          error: 'Consentimiento no vigente para el receptor solicitado',
        });
        return res.status(403).json({ message: 'Consentimiento no vigente para compartir datos con este receptor' });
      }
    }

    const paciente = await User.findById(pacienteId).select('nombre email telefono documento genero fechaNacimiento direccion rol');

    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const now = new Date();
    const ts = now.toISOString().replace(/[-:]/g, '').split('.')[0];

    const message = [
      `MSH|^~\\&|IntegraSalud|Hospital|SistemaExterno|RedClinica|${ts}||ADT^A04|${now.getTime()}|P|2.5`,
      `EVN|A04|${ts}`,
      `PID|1||${paciente.documento || paciente._id}||${paciente.nombre || ''}||${paciente.fechaNacimiento ? toIsoDate(paciente.fechaNacimiento)?.slice(0, 10).replace(/-/g, '') : ''}|${(paciente.genero || '').slice(0, 1).toUpperCase()}|||${paciente.direccion || ''}||${paciente.telefono || ''}|${paciente.email || ''}`,
      `PV1|1|O|||MED||||||||||||||||||||||||||||||||||||||||${ts}`,
    ].join('\n');

    await persistInteropTransaction({
      endpointNombre: receiver,
      paciente: pacienteId,
      usuarioSolicitante: req.user?._id || req.user?.id || null,
      tipoMensaje: 'HL7_ADT_A04',
      requestPayload: { receiver, pacienteId },
      responsePayload: message,
      estado: 'success',
      codigoEstadoHttp: 200,
    });

    await logAuditEvent(req, {
      action: 'interop_hl7_adt_a04_export',
      resourceType: 'patient',
      resourceId: pacienteId,
      details: `Export HL7 ADT A04 hacia receptor ${receiver}`,
    });

    return res.type('text/plain').send(message);
  } catch (error) {
    return res.status(500).json({ message: 'Error generando mensaje HL7 ADT' });
  }
};

exports.getFhirObservations = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 200, 1000));

    const paciente = await User.findById(pacienteId).select('_id rol');
    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const registros = await HistoriaClinica.find({ paciente: pacienteId })
      .populate('medico', 'nombre')
      .sort({ fecha: -1 })
      .limit(limit);

    const resources = registros.map((item) => toFhirObservation(item, pacienteId));

    await persistInteropTransaction({
      endpointNombre: buildReceiver(req),
      paciente: pacienteId,
      usuarioSolicitante: req.user?._id || req.user?.id || null,
      tipoMensaje: 'FHIR_Observation',
      requestPayload: { pacienteId, limit },
      responsePayload: { count: resources.length },
      estado: 'success',
      codigoEstadoHttp: 200,
    });

    return res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: resources.length,
      entry: resources.map((resource) => ({ resource })),
    });
  } catch (_error) {
    return res.status(500).json({ message: 'Error generando recursos FHIR Observation' });
  }
};
