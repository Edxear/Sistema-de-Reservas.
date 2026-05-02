const ADMIN_ROUTE_PATTERNS = [
  '/dashboard',
  '/turnos',
  '/perfil',
  '/recetas',
  '/teleconsultas',
  '/pizarra',
  '/ordenes-medicas',
  '/soporte',
  '/enfermeria',
  '/salud-mental',
  '/guardia-medica',
  '/paramedicos-ambulancia',
  '/mantenimiento',
  '/organigrama',
  '/gestion/medicos',
  '/gestion/pacientes',
  '/historial/*',
  '/pacientes/*',
  '/medicos',
  '/medicos/*',
  '/medico/*',
];

const PATIENT_ROUTE_PATTERNS = [
  '/dashboard',
  '/turnos',
  '/perfil',
  '/teleconsultas',
  '/medicos',
  '/medicos/*',
  '/medico/*',
];

export const DEMO_ALLOWED_ROUTES = {
  admin: ADMIN_ROUTE_PATTERNS,
  paciente: PATIENT_ROUTE_PATTERNS,
};

const matchesPattern = (pathname, pattern) => {
  if (pattern.endsWith('/*')) {
    const basePath = pattern.slice(0, -1);
    return pathname.startsWith(basePath);
  }

  return pathname === pattern;
};

export const isDemoRouteAllowed = (pathname, demoRole) => {
  const roleKey = demoRole === 'paciente' ? 'paciente' : 'admin';
  const patterns = DEMO_ALLOWED_ROUTES[roleKey] || DEMO_ALLOWED_ROUTES.admin;
  return patterns.some((pattern) => matchesPattern(pathname, pattern));
};

export const getDemoDefaultRoute = (demoRole) => {
  if (demoRole === 'paciente') {
    return '/dashboard';
  }

  return '/dashboard';
};