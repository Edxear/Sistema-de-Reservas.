export const ROLE = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MEDICO: 'medico',
  ENFERMERO: 'enfermero',
  SECRETARIA: 'secretaria',
  PACIENTE: 'paciente',
};

export const normalizeRole = (role) => String(role || '').toLowerCase();

export const isPatientRole = (role) => normalizeRole(role) === ROLE.PACIENTE;
export const isSuperAdminRole = (role) => normalizeRole(role) === ROLE.SUPERADMIN;
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