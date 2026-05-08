const { STRATEGIC_MODULES_DATA } = require('../data/strategicModulesData');
const { groupStrategicModulesByDomain } = require('../data/strategicModuleDomains');
const StrategicModuleDomainSnapshot = require('../models/StrategicModuleDomainSnapshot');
const mongoose = require('mongoose');

// ─── lazy model references (only resolved when DB is available) ───────────────
const getModel = (name) => {
  try {
    return require(`../models/${name}`);
  } catch {
    return null;
  }
};

const normalizeRole = (role) => String(role || '').toLowerCase();

const hasAccess = (user, moduleData) => {
  const role = normalizeRole(user?.rol);
  if (!role) return false;
  if (role === 'superadmin' || user?.esSuperAdminPrincipal === true) return true;
  return (moduleData.allowedRoles || []).includes(role);
};

// ─── live metric resolvers per module slug ────────────────────────────────────
const TODAY_START = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const liveMetricResolvers = {
  'historia-clinica-electronica': async () => {
    const HistoriaClinica = getModel('HistoriaClinica');
    if (!HistoriaClinica) return null;
    const [total, hoy] = await Promise.all([
      HistoriaClinica.countDocuments({}),
      HistoriaClinica.countDocuments({ fecha: { $gte: TODAY_START() } }),
    ]);
    return [
      { label: 'Historias registradas', value: String(total) },
      { label: 'Nuevas hoy', value: String(hoy) },
    ];
  },

  'farmacia-dispensacion': async () => {
    const Receta = getModel('Receta');
    if (!Receta) return null;
    const [total, hoy] = await Promise.all([
      Receta.countDocuments({}),
      Receta.countDocuments({ fechaEmision: { $gte: TODAY_START() } }),
    ]);
    return [
      { label: 'Recetas emitidas', value: String(total) },
      { label: 'Emitidas hoy', value: String(hoy) },
    ];
  },

  'gestion-agenda-avanzada': async () => {
    const Booking = getModel('Booking');
    if (!Booking) return null;
    const [hoy, proximas] = await Promise.all([
      Booking.countDocuments({ fecha: { $gte: TODAY_START() } }),
      Booking.countDocuments({ fecha: { $gte: new Date() }, estado: { $ne: 'cancelado' } }),
    ]);
    return [
      { label: 'Reservas hoy', value: String(hoy) },
      { label: 'Proximas confirmadas', value: String(proximas) },
    ];
  },

  'admision-registro-pacientes': async () => {
    const Booking = getModel('Booking');
    if (!Booking) return null;
    const [hoy, total] = await Promise.all([
      Booking.countDocuments({ fecha: { $gte: TODAY_START() } }),
      Booking.countDocuments({}),
    ]);
    return [
      { label: 'Ingresos hoy', value: String(hoy) },
      { label: 'Total reservas', value: String(total) },
    ];
  },

  'notificaciones-mensajeria-interna': async () => {
    const Notificacion = getModel('Notificacion');
    if (!Notificacion) return null;
    const [total, noLeidas] = await Promise.all([
      Notificacion.countDocuments({}),
      Notificacion.countDocuments({ leido: false }),
    ]);
    return [
      { label: 'Total notificaciones', value: String(total) },
      { label: 'Sin leer', value: String(noLeidas) },
    ];
  },

  'auditoria-logs': async () => {
    const AuditLog = getModel('AuditLog');
    if (!AuditLog) return null;
    const [total, hoy] = await Promise.all([
      AuditLog.countDocuments({}),
      AuditLog.countDocuments({ createdAt: { $gte: TODAY_START() } }),
    ]);
    return [
      { label: 'Eventos totales', value: String(total) },
      { label: 'Eventos hoy', value: String(hoy) },
    ];
  },

  'telemedicina-avanzada': async () => {
    const Teleconsulta = getModel('Teleconsulta');
    if (!Teleconsulta) return null;
    const [activas, hoy] = await Promise.all([
      Teleconsulta.countDocuments({ estado: { $in: ['programada', 'en_curso'] } }),
      Teleconsulta.countDocuments({ fechaProgramada: { $gte: TODAY_START() } }),
    ]);
    return [
      { label: 'Sesiones activas', value: String(activas) },
      { label: 'Sesiones hoy', value: String(hoy) },
    ];
  },
};

/**
 * Attempt to compute live metrics for a module slug.
 * Returns null if no resolver is defined, the DB is not connected, or the query fails.
 */
const computeLiveMetrics = async (slug) => {
  if (mongoose.connection.readyState !== 1) return null;
  const resolver = liveMetricResolvers[slug];
  if (!resolver) return null;
  try {
    return await resolver();
  } catch {
    return null;
  }
};

// ─── serialization ────────────────────────────────────────────────────────────
const serializeModule = (moduleData, liveMetricsOverride = null) => ({
  slug: moduleData.slug,
  title: moduleData.title,
  status: moduleData.status,
  owner: moduleData.owner,
  lastUpdated: moduleData.lastUpdated,
  liveMetrics: liveMetricsOverride || moduleData.liveMetrics,
  highlights: moduleData.highlights,
  checkpoints: moduleData.checkpoints,
  timeline: moduleData.timeline,
  localBackend: true,
  liveData: liveMetricsOverride !== null,
});

const loadDomains = async () => {
  const records = await StrategicModuleDomainSnapshot.find({}).sort({ order: 1, title: 1 }).lean();
  if (records.length > 0) {
    return records;
  }

  return groupStrategicModulesByDomain(STRATEGIC_MODULES_DATA);
};

const flattenDomainModules = (domains = []) => domains.flatMap((domain) => (domain.modules || []).map((moduleData) => ({
  ...moduleData,
  domain: {
    key: domain.key,
    title: domain.title,
    order: domain.order,
  },
})));

const serializeDomain = (domain) => ({
  key: domain.key,
  title: domain.title,
  order: domain.order,
  modules: (domain.modules || []).map((m) => serializeModule(m)),
});

// ─── controllers ─────────────────────────────────────────────────────────────
exports.listStrategicModules = async (req, res) => {
  const domains = await loadDomains();
  const visibleDomains = domains
    .map((domain) => ({
      ...domain,
      modules: (domain.modules || []).filter((moduleData) => hasAccess(req.user, moduleData)),
    }))
    .filter((domain) => domain.modules.length > 0);

  const visibleModules = flattenDomainModules(visibleDomains).map((m) => serializeModule(m));

  return res.json({
    localBackend: true,
    generatedAt: new Date().toISOString(),
    domains: visibleDomains.map(serializeDomain),
    modules: visibleModules,
  });
};

exports.getStrategicModuleDetail = async (req, res) => {
  const domains = await loadDomains();
  const moduleData = flattenDomainModules(domains).find((item) => item.slug === req.params.slug);

  if (!moduleData) {
    return res.status(404).json({ message: 'Modulo estrategico no encontrado' });
  }

  if (!hasAccess(req.user, moduleData)) {
    return res.status(403).json({ message: 'No tienes permiso para acceder a este modulo' });
  }

  const liveMetrics = await computeLiveMetrics(req.params.slug);

  return res.json({
    localBackend: true,
    generatedAt: new Date().toISOString(),
    module: serializeModule(moduleData, liveMetrics),
  });
};

exports.patchModuleCheckpoint = async (req, res) => {
  const { slug } = req.params;
  const { name, state, note } = req.body || {};

  if (!name || !state) {
    return res.status(400).json({ message: 'Se requieren name y state del checkpoint' });
  }

  const VALID_STATES = ['ok', 'warn', 'danger'];
  if (!VALID_STATES.includes(state)) {
    return res.status(400).json({ message: `state debe ser uno de: ${VALID_STATES.join(', ')}` });
  }

  const domain = await StrategicModuleDomainSnapshot.findOne({ 'modules.slug': slug });
  if (!domain) {
    return res.status(404).json({ message: 'Modulo no encontrado en ningun dominio' });
  }

  const mod = domain.modules.find((m) => m.slug === slug);
  if (!mod) {
    return res.status(404).json({ message: 'Modulo no encontrado' });
  }

  if (!hasAccess(req.user, mod)) {
    return res.status(403).json({ message: 'No tienes permiso para modificar este modulo' });
  }

  const existing = mod.checkpoints.find((cp) => cp.name === name);
  if (existing) {
    existing.state = state;
    if (note !== undefined) existing.note = note;
  } else {
    mod.checkpoints.push({ name, state, note: note || '' });
  }

  domain.markModified('modules');
  await domain.save();

  return res.json({
    localBackend: true,
    slug,
    checkpoint: { name, state, note: note ?? existing?.note ?? '' },
  });
};