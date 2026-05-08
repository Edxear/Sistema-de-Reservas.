const { STRATEGIC_MODULES_DATA } = require('../data/strategicModulesData');
const { groupStrategicModulesByDomain } = require('../data/strategicModuleDomains');
const StrategicModuleDomainSnapshot = require('../models/StrategicModuleDomainSnapshot');

const normalizeRole = (role) => String(role || '').toLowerCase();

const hasAccess = (user, moduleData) => {
  const role = normalizeRole(user?.rol);
  if (!role) return false;
  if (role === 'superadmin' || user?.esSuperAdminPrincipal === true) return true;
  return (moduleData.allowedRoles || []).includes(role);
};

const serializeModule = (moduleData) => ({
  slug: moduleData.slug,
  title: moduleData.title,
  status: moduleData.status,
  owner: moduleData.owner,
  lastUpdated: moduleData.lastUpdated,
  liveMetrics: moduleData.liveMetrics,
  highlights: moduleData.highlights,
  checkpoints: moduleData.checkpoints,
  timeline: moduleData.timeline,
  localBackend: true,
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
  modules: (domain.modules || []).map(serializeModule),
});

exports.listStrategicModules = async (req, res) => {
  const domains = await loadDomains();
  const visibleDomains = domains
    .map((domain) => ({
      ...domain,
      modules: (domain.modules || []).filter((moduleData) => hasAccess(req.user, moduleData)),
    }))
    .filter((domain) => domain.modules.length > 0);

  const visibleModules = flattenDomainModules(visibleDomains).map(serializeModule);

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

  return res.json({
    localBackend: true,
    generatedAt: new Date().toISOString(),
    module: serializeModule(moduleData),
  });
};