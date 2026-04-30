import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE } from '../utils/roles';
import { getDemoDefaultRoute, isDemoRouteAllowed } from '../utils/demoRoutes';

import LoginRegister from '../pages/auth/LoginRegister';
import Dashboard from '../pages/app/Dashboard';
import DashboardPaciente from '../pages/app/DashboardPaciente';
import Turnos from '../pages/app/Turnos';
import Perfil from '../pages/app/Perfil';
import MedicosList from '../pages/medicos/MedicosList';
import PaginaMedico from '../pages/medicos/PaginaMedico';
import PaginaPublicaMedico from '../pages/medicos/PaginaPublicaMedico';
import GestionMedicos from '../pages/medicos/GestionMedicos';
import GestionPacientes from '../pages/pacientes/GestionPacientes';
import PacienteDetalle from '../pages/pacientes/PacienteDetalle';
import HistoriaClinica from '../pages/clinico/HistoriaClinica';
import Recetas from '../pages/clinico/Recetas';
import OrdenesMedicas from '../pages/clinico/OrdenesMedicas';
import Teleconsultas from '../pages/teleconsultas/Teleconsultas';
import Organigrama from '../pages/organizacion/Organigrama';
import Soporte from '../pages/soporte/Soporte';
import Enfermeria from '../pages/enfermeria/Enfermeria';
import PizarraDigital from '../pages/clinico/PizarraDigital';
import DemoLanding from '../pages/demo/DemoLanding';

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, user, loading, demoMode, demoRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando sesion...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (demoMode && !isDemoRouteAllowed(location.pathname, demoRole)) {
    return <Navigate to={getDemoDefaultRoute(demoRole)} replace />;
  }

  // El administrador principal tiene acceso transversal sin restricciones.
  if (user?.rol === ROLE.SUPERADMIN || user?.esSuperAdminPrincipal === true) {
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, isGuestSession } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando sesion...</div>;
  }

  if (isAuthenticated && !isGuestSession) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function AppRoutes() {
  const { user } = useAuth();
  const isPatientDashboard = user?.rol === ROLE.PACIENTE;

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="/login"
        element={(
          <PublicRoute>
            <LoginRegister />
          </PublicRoute>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            {isPatientDashboard ? <DashboardPaciente /> : <Dashboard />}
          </ProtectedRoute>
        )}
      />
      <Route
        path="/historial/:pacienteId"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA]}>
            <HistoriaClinica />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/recetas"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <Recetas />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/perfil"
        element={(
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/turnos"
        element={(
          <ProtectedRoute>
            <Turnos />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/pacientes/:pacienteId"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA]}>
            <PacienteDetalle />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/organigrama"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA]}>
            <Organigrama />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/gestion/medicos"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <GestionMedicos />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/gestion/pacientes"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA]}>
            <GestionPacientes />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/soporte"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <Soporte />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/gestion/obra-social"
        element={(
          <Navigate to="/recetas" replace />
        )}
      />
      <Route
        path="/enfermeria"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <Enfermeria />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/pizarra"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA]}>
            <PizarraDigital />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/ordenes-medicas"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <OrdenesMedicas />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/teleconsultas"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.PACIENTE, ROLE.ENFERMERO, ROLE.SECRETARIA]}>
            <Teleconsultas />
          </ProtectedRoute>
        )}
      />
      <Route path="/medicos" element={<MedicosList />} />
      <Route path="/medicos/:id" element={<PaginaMedico />} />
      <Route path="/medico/:id" element={<PaginaPublicaMedico />} />
      <Route path="/demo" element={<DemoLanding />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
