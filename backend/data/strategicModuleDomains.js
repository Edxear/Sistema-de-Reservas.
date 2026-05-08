const { STRATEGIC_MODULES_DATA } = require('./strategicModulesData');

const STRATEGIC_MODULE_DOMAIN_MAP = {
  'historia-clinica-electronica': { key: 'clinico', title: 'Clinico', order: 1 },
  'laboratorio-resultados': { key: 'diagnostico', title: 'Diagnostico', order: 2 },
  'imagenologia-diagnostico': { key: 'diagnostico', title: 'Diagnostico', order: 2 },
  'farmacia-dispensacion': { key: 'farmacia', title: 'Farmacia', order: 3 },
  'facturacion-cobranzas': { key: 'finanzas', title: 'Finanzas', order: 4 },
  'admision-registro-pacientes': { key: 'front-office', title: 'Front office', order: 5 },
  'gestion-agenda-avanzada': { key: 'operaciones', title: 'Operaciones', order: 6 },
  'notificaciones-mensajeria-interna': { key: 'comunicacion', title: 'Comunicacion', order: 7 },
  'reportes-business-intelligence': { key: 'analitica', title: 'Analitica', order: 8 },
  'auditoria-logs': { key: 'cumplimiento', title: 'Cumplimiento', order: 9 },
  interoperabilidad: { key: 'integraciones', title: 'Integraciones', order: 10 },
  'telemedicina-avanzada': { key: 'digital-care', title: 'Digital care', order: 11 },
  'gestion-cuidados-criticos-uci': { key: 'criticos', title: 'Criticos', order: 12 },
  'control-acceso-por-rol': { key: 'seguridad', title: 'Seguridad', order: 13 },
  'inventario-insumos-equipos': { key: 'operaciones', title: 'Operaciones', order: 6 },
  'gestion-donantes-transfusiones': { key: 'hemoterapia', title: 'Hemoterapia', order: 14 },
  'biopsias-anatomia-patologica': { key: 'diagnostico', title: 'Diagnostico', order: 2 },
  'nutricion-dietoterapia': { key: 'clinico', title: 'Clinico', order: 1 },
  'kinesiologia-rehabilitacion': { key: 'rehabilitacion', title: 'Rehabilitacion', order: 15 },
  'trabajo-social': { key: 'soporte', title: 'Soporte', order: 16 },
  'gestion-esterilizacion-central': { key: 'operaciones', title: 'Operaciones', order: 6 },
  'comites-auditoria-clinica': { key: 'calidad', title: 'Calidad', order: 17 },
  'docencia-investigacion': { key: 'academico', title: 'Academico', order: 18 },
  'atencion-domiciliaria': { key: 'continuidad', title: 'Continuidad asistencial', order: 19 },
  'portal-paciente-autogestion': { key: 'digital-care', title: 'Digital care', order: 11 },
  'modulo-urgencias-avanzado': { key: 'criticos', title: 'Criticos', order: 12 },
  'quirofanos-bloques-quirurgicos': { key: 'quirurgico', title: 'Quirurgico', order: 20 },
  'unidad-cuidados-paliativos': { key: 'clinico', title: 'Clinico', order: 1 },
  'rehabilitacion-cardiovascular-ergometria': { key: 'cardiologia', title: 'Cardiologia', order: 21 },
  'modulo-salud-ocupacional': { key: 'empresas', title: 'Empresas', order: 22 },
  'gestion-residuos-biologicos': { key: 'ambiental', title: 'Ambiental', order: 23 },
};

function groupStrategicModulesByDomain(modules = STRATEGIC_MODULES_DATA) {
  const grouped = new Map();

  modules.forEach((moduleData) => {
    const domain = STRATEGIC_MODULE_DOMAIN_MAP[moduleData.slug] || { key: 'general', title: 'General', order: 99 };
    if (!grouped.has(domain.key)) {
      grouped.set(domain.key, {
        key: domain.key,
        title: domain.title,
        order: domain.order,
        modules: [],
      });
    }

    grouped.get(domain.key).modules.push({ ...moduleData });
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .map((domain) => ({
      ...domain,
      modules: domain.modules.sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

module.exports = {
  STRATEGIC_MODULE_DOMAIN_MAP,
  groupStrategicModulesByDomain,
};