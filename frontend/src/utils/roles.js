export const ROLE = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MEDICO: 'medico',
  ENFERMERO: 'enfermero',
  SECRETARIA: 'secretaria',
  PACIENTE: 'paciente',
};

export const normalizeRole = (role) => String(role || '').toLowerCase();
const normalizeText = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const isPatientRole = (role) => normalizeRole(role) === ROLE.PACIENTE;
export const isSuperAdminRole = (role) => normalizeRole(role) === ROLE.SUPERADMIN;
export const isSuperAdminPrincipal = (user) => user?.esSuperAdminPrincipal === true;
export const isAdminRole = (role) => [ROLE.ADMIN, ROLE.SUPERADMIN].includes(normalizeRole(role));

export const canManageDoctors = (role) => isAdminRole(role);
export const canManagePatients = (role) => [ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA].includes(normalizeRole(role));
export const canAccessHistoria = (role) => [ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA].includes(normalizeRole(role));
export const canAccessRecetas = (role) => [ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN].includes(normalizeRole(role));
export const canAccessPacienteDetalle = (role) => [ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA].includes(normalizeRole(role));
export const canAccessOrganigrama = (role) => !isPatientRole(role);
export const canManageBookings = (role) => [ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA, ROLE.ENFERMERO].includes(normalizeRole(role));
export const canViewAdminMetrics = (role) => [ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA].includes(normalizeRole(role));
export const canAccessSupport = (role) => [ROLE.ADMIN, ROLE.SUPERADMIN].includes(normalizeRole(role));
export const canViewPrivateColleagueComments = (role) => [ROLE.ADMIN, ROLE.SUPERADMIN].includes(normalizeRole(role));
export const canAccessNursingArea = (role) => [ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN].includes(normalizeRole(role));
export const canAccessMentalHealthArea = (user) => {
  const role = normalizeRole(user?.rol);
  if ([ROLE.ADMIN, ROLE.SUPERADMIN].includes(role)) return true;
  if (role !== ROLE.ENFERMERO) return false;

  const rama = normalizeText(user?.ramaEnfermeria || user?.sectorOrganigrama);
  const cargo = normalizeText(user?.cargoOrganigrama);
  const area = normalizeText(user?.areaOrganigrama);

  return (
    rama.includes('salud mental') || cargo.includes('salud mental') || area.includes('salud mental')
    || rama.includes('psiquiatr') || cargo.includes('psiquiatr') || area.includes('psiquiatr')
    || rama.includes('neuropsiq') || area.includes('neuropsiq')
    || rama.includes('psico') || area.includes('psico')
  );
};
export const canAccessGuardiaMedicaArea = (user) => {
  const role = normalizeRole(user?.rol);
  if ([ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.MEDICO].includes(role)) return true;

  const rama = normalizeText(user?.ramaEnfermeria || user?.sectorOrganigrama);
  const cargo = normalizeText(user?.cargoOrganigrama);
  const area = normalizeText(user?.areaOrganigrama);

  return (
    rama.includes('guardia')
    || rama.includes('emerg')
    || cargo.includes('guardia')
    || cargo.includes('shock')
    || area.includes('guardia')
  );
};

export const canAccessMantenimientoArea = (user) => {
  const role = normalizeRole(user?.rol);
  if ([ROLE.ADMIN, ROLE.SUPERADMIN].includes(role)) return true;

  const cargo = normalizeText(user?.cargoOrganigrama);
  const area = normalizeText(user?.areaOrganigrama);

  return (
    cargo.includes('mantenimiento')
    || cargo.includes('infraestructura')
    || cargo.includes('biomed')
    || area.includes('mantenimiento')
    || area.includes('infraestructura')
    || area.includes('ingenieria')
  );
};

export const canAccessParamedicosArea = (user) => {
  const role = normalizeRole(user?.rol);
  if ([ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.MEDICO].includes(role)) return true;

  const rama = normalizeText(user?.ramaEnfermeria || user?.sectorOrganigrama);
  const cargo = normalizeText(user?.cargoOrganigrama);
  const area = normalizeText(user?.areaOrganigrama);

  return (
    rama.includes('ambul')
    || rama.includes('prehospital')
    || rama.includes('guardia')
    || cargo.includes('paramed')
    || cargo.includes('ambul')
    || area.includes('ambul')
    || area.includes('emerg')
  );
};
export const canAccessPizarra = (role) => [ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA].includes(normalizeRole(role));
export const canAccessOrdenesMedicas = (role) => [ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN].includes(normalizeRole(role));
export const canAccessTeleconsultas = (role) => [ROLE.MEDICO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.PACIENTE, ROLE.ENFERMERO, ROLE.SECRETARIA].includes(normalizeRole(role));