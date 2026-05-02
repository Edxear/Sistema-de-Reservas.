/**
 * Phase 6 – Unit tests for roles.js
 * Uses CRA's built-in Jest + jsdom environment (no extra config needed).
 */
/* eslint-env jest */

import {
  ROLE,
  isPatientRole,
  isSuperAdminRole,
  isAdminRole,
  canAccessNursingArea,
  canAccessMentalHealthArea,
  canAccessGuardiaMedicaArea,
  canAccessMantenimientoArea,
  canAccessParamedicosArea,
  canAccessHistoria,
  canManageDoctors,
  canManagePatients,
  canAccessPizarra,
  canAccessOrdenesMedicas,
} from './roles';

// ── helpers ──────────────────────────────────────────────────────────────────

const makeUser = (rol, extras = {}) => ({ rol, ...extras });

// ── isPatientRole / isSuperAdminRole / isAdminRole ────────────────────────────
describe('role predicates', () => {
  test('isPatientRole returns true only for paciente', () => {
    expect(isPatientRole(ROLE.PACIENTE)).toBe(true);
    expect(isPatientRole(ROLE.ADMIN)).toBe(false);
    expect(isPatientRole('PACIENTE')).toBe(true); // case-insensitive
  });

  test('isSuperAdminRole', () => {
    expect(isSuperAdminRole(ROLE.SUPERADMIN)).toBe(true);
    expect(isSuperAdminRole(ROLE.ADMIN)).toBe(false);
  });

  test('isAdminRole includes admin and superadmin', () => {
    expect(isAdminRole(ROLE.ADMIN)).toBe(true);
    expect(isAdminRole(ROLE.SUPERADMIN)).toBe(true);
    expect(isAdminRole(ROLE.MEDICO)).toBe(false);
  });
});

// ── canManage* ────────────────────────────────────────────────────────────────
describe('canManageDoctors', () => {
  test('only admin roles', () => {
    expect(canManageDoctors(ROLE.ADMIN)).toBe(true);
    expect(canManageDoctors(ROLE.SUPERADMIN)).toBe(true);
    expect(canManageDoctors(ROLE.MEDICO)).toBe(false);
    expect(canManageDoctors(ROLE.PACIENTE)).toBe(false);
  });
});

describe('canManagePatients', () => {
  test('admin, superadmin, secretaria', () => {
    expect(canManagePatients(ROLE.SECRETARIA)).toBe(true);
    expect(canManagePatients(ROLE.MEDICO)).toBe(false);
  });
});

// ── canAccessHistoria ─────────────────────────────────────────────────────────
describe('canAccessHistoria', () => {
  test('clinical roles have access', () => {
    [ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA].forEach((r) => {
      expect(canAccessHistoria(r)).toBe(true);
    });
  });
  test('paciente does not have access', () => {
    expect(canAccessHistoria(ROLE.PACIENTE)).toBe(false);
  });
});

// ── canAccessNursingArea ──────────────────────────────────────────────────────
describe('canAccessNursingArea', () => {
  test('enfermero, admin, superadmin can access', () => {
    expect(canAccessNursingArea(ROLE.ENFERMERO)).toBe(true);
    expect(canAccessNursingArea(ROLE.ADMIN)).toBe(true);
    expect(canAccessNursingArea(ROLE.SUPERADMIN)).toBe(true);
  });
  test('medico and paciente cannot access', () => {
    expect(canAccessNursingArea(ROLE.MEDICO)).toBe(false);
    expect(canAccessNursingArea(ROLE.PACIENTE)).toBe(false);
  });
});

// ── canAccessMentalHealthArea ─────────────────────────────────────────────────
describe('canAccessMentalHealthArea', () => {
  test('admin always has access', () => {
    expect(canAccessMentalHealthArea(makeUser(ROLE.ADMIN))).toBe(true);
  });

  test('superadmin always has access', () => {
    expect(canAccessMentalHealthArea(makeUser(ROLE.SUPERADMIN))).toBe(true);
  });

  test('enfermero with salud mental branch has access', () => {
    const user = makeUser(ROLE.ENFERMERO, { ramaEnfermeria: 'Salud Mental' });
    expect(canAccessMentalHealthArea(user)).toBe(true);
  });

  test('enfermero with psiquiatria area has access', () => {
    const user = makeUser(ROLE.ENFERMERO, { areaOrganigrama: 'Psiquiatría' });
    expect(canAccessMentalHealthArea(user)).toBe(true);
  });

  test('enfermero without mental health profile has no access', () => {
    const user = makeUser(ROLE.ENFERMERO, { ramaEnfermeria: 'Guardia' });
    expect(canAccessMentalHealthArea(user)).toBe(false);
  });

  test('medico has no access', () => {
    expect(canAccessMentalHealthArea(makeUser(ROLE.MEDICO))).toBe(false);
  });

  test('null/undefined user returns false', () => {
    expect(canAccessMentalHealthArea(null)).toBe(false);
    expect(canAccessMentalHealthArea(undefined)).toBe(false);
  });
});

// ── canAccessGuardiaMedicaArea ────────────────────────────────────────────────
describe('canAccessGuardiaMedicaArea', () => {
  test('medico has access', () => {
    expect(canAccessGuardiaMedicaArea(makeUser(ROLE.MEDICO))).toBe(true);
  });

  test('admin has access', () => {
    expect(canAccessGuardiaMedicaArea(makeUser(ROLE.ADMIN))).toBe(true);
  });

  test('enfermero with guardia branch has access', () => {
    const user = makeUser(ROLE.ENFERMERO, { ramaEnfermeria: 'Guardia' });
    expect(canAccessGuardiaMedicaArea(user)).toBe(true);
  });

  test('paciente has no access', () => {
    expect(canAccessGuardiaMedicaArea(makeUser(ROLE.PACIENTE))).toBe(false);
  });
});

// ── canAccessMantenimientoArea ────────────────────────────────────────────────
describe('canAccessMantenimientoArea', () => {
  test('admin has access', () => {
    expect(canAccessMantenimientoArea(makeUser(ROLE.ADMIN))).toBe(true);
  });

  test('user with mantenimiento cargo has access', () => {
    const user = makeUser(ROLE.SECRETARIA, { cargoOrganigrama: 'Mantenimiento General' });
    expect(canAccessMantenimientoArea(user)).toBe(true);
  });

  test('user with infraestructura area has access', () => {
    const user = makeUser(ROLE.SECRETARIA, { areaOrganigrama: 'Infraestructura' });
    expect(canAccessMantenimientoArea(user)).toBe(true);
  });

  test('nurse without maintenance profile has no access', () => {
    const user = makeUser(ROLE.ENFERMERO, { ramaEnfermeria: 'Internacion Adultos' });
    expect(canAccessMantenimientoArea(user)).toBe(false);
  });
});

// ── canAccessParamedicosArea ──────────────────────────────────────────────────
describe('canAccessParamedicosArea', () => {
  test('medico has access', () => {
    expect(canAccessParamedicosArea(makeUser(ROLE.MEDICO))).toBe(true);
  });

  test('user with paramedico cargo has access', () => {
    const user = makeUser(ROLE.ENFERMERO, { cargoOrganigrama: 'Paramedico Avanzado' });
    expect(canAccessParamedicosArea(user)).toBe(true);
  });

  test('user with ambulancia area has access', () => {
    const user = makeUser(ROLE.ENFERMERO, { areaOrganigrama: 'Ambulancia' });
    expect(canAccessParamedicosArea(user)).toBe(true);
  });

  test('paciente has no access', () => {
    expect(canAccessParamedicosArea(makeUser(ROLE.PACIENTE))).toBe(false);
  });
});

// ── canAccessPizarra / canAccessOrdenesMedicas ────────────────────────────────
describe('pizarra and ordenes', () => {
  test('canAccessPizarra allows clinical roles', () => {
    [ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA].forEach((r) => {
      expect(canAccessPizarra(r)).toBe(true);
    });
    expect(canAccessPizarra(ROLE.PACIENTE)).toBe(false);
  });

  test('canAccessOrdenesMedicas allows medico/enfermero/admin', () => {
    expect(canAccessOrdenesMedicas(ROLE.MEDICO)).toBe(true);
    expect(canAccessOrdenesMedicas(ROLE.ENFERMERO)).toBe(true);
    expect(canAccessOrdenesMedicas(ROLE.PACIENTE)).toBe(false);
    expect(canAccessOrdenesMedicas(ROLE.SECRETARIA)).toBe(false);
  });
});
