import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, ROLE } from '../utils/roles';
import { getDemoDefaultRoute, isDemoRouteAllowed } from '../utils/demoRoutes';

import LoginRegister from '../pages/auth/LoginRegister';
import { SkeletonAreaPage } from '../components/SkeletonLoader';
import Dashboard from '../pages/app/Dashboard';
import DashboardPaciente from '../pages/app/DashboardPaciente';
import Turnos from '../pages/app/Turnos';
import Perfil from '../pages/app/Perfil';
import MedicosList from '../pages/medicos/MedicosList';
import PaginaMedico from '../pages/medicos/PaginaMedico';
import PaginaPublicaMedico from '../pages/medicos/PaginaPublicaMedico';
const GestionMedicos = React.lazy(() => import('../pages/medicos/GestionMedicos'));
const GestionPacientes = React.lazy(() => import('../pages/pacientes/GestionPacientes'));
const PacienteDetalle = React.lazy(() => import('../pages/pacientes/PacienteDetalle'));
const HistoriaClinica = React.lazy(() => import('../pages/clinico/HistoriaClinica'));
const Recetas = React.lazy(() => import('../pages/clinico/Recetas'));
const OrdenesMedicas = React.lazy(() => import('../pages/clinico/OrdenesMedicas'));
const Teleconsultas = React.lazy(() => import('../pages/teleconsultas/Teleconsultas'));
const PizarraDigital = React.lazy(() => import('../pages/clinico/PizarraDigital'));
const DemoLanding = React.lazy(() => import('../pages/demo/DemoLanding'));

const Organigrama = React.lazy(() => import('../pages/organizacion/Organigrama'));
const Soporte = React.lazy(() => import('../pages/soporte/Soporte'));
const Enfermeria = React.lazy(() => import('../pages/enfermeria/Enfermeria'));
const SaludMentalArea = React.lazy(() => import('../pages/saludmental/SaludMentalArea'));
const GuardiaMedicaArea = React.lazy(() => import('../pages/guardia/GuardiaMedicaArea'));
const ParamedicosArea = React.lazy(() => import('../pages/paramedicos/ParamedicosArea'));
const MantenimientoArea = React.lazy(() => import('../pages/mantenimiento/MantenimientoArea'));
const OperationalDashboard = React.lazy(() => import('../pages/operaciones/OperationalDashboard'));
const StrategicModulesHub = React.lazy(() => import('../pages/modulos/StrategicModulesHub'));
const StrategicModuleArea = React.lazy(() => import('../pages/modulos/StrategicModuleArea'));

const PageLoadingFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '24px 16px',
    gap: 16,
    color: '#6b7280',
    fontSize: 15,
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '3px solid #e5e7eb',
      borderTop: '3px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <span>Cargando módulo...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const LazyRoute = ({ children, area = false }) => (
  <Suspense fallback={area ? <SkeletonAreaPage /> : <PageLoadingFallback />}>
    {children}
  </Suspense>
);

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, user, loading, demoMode, demoRole } = useAuth();
  const location = useLocation();
  const normalizedUserRole = normalizeRole(user?.rol);
  const normalizedAllowedRoles = allowedRoles?.map((role) => normalizeRole(role)) || null;

  if (loading || (demoMode && !user)) {
    return <PageLoadingFallback />;
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

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedUserRole)) {
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
  const { user, demoMode } = useAuth();
  const isVercelHost = typeof window !== 'undefined' && (
    window.location.hostname.toLowerCase() === 'vercel.app'
    || window.location.hostname.toLowerCase().endsWith('.vercel.app')
  );
  const isLocalDemoHost = typeof window !== 'undefined' && (
    window.location.hostname.toLowerCase() === 'localhost'
    || window.location.hostname.toLowerCase() === '127.0.0.1'
  );
  const isPublicDemoHost = typeof window !== 'undefined' && (
    window.location.hostname.toLowerCase() === 'sistema-de-reservas-eta.vercel.app'
    || window.location.hostname.toLowerCase().endsWith('.sistema-de-reservas-eta.vercel.app')
  );
  const isPatientDashboard = user?.rol === ROLE.PACIENTE;

  return (
      <Route
        path="/pizarra"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <LazyRoute>
              <PizarraDigital />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
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
            <LazyRoute>
              <Organigrama />
            </LazyRoute>
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
            <LazyRoute>
              <Soporte />
            </LazyRoute>
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
            <LazyRoute>
              <Enfermeria />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/salud-mental"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <LazyRoute area>
              <SaludMentalArea />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/guardia-medica"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <LazyRoute area>
              <GuardiaMedicaArea />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/paramedicos-ambulancia"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <LazyRoute area>
              <ParamedicosArea />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/mantenimiento"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.SECRETARIA]}>
            <LazyRoute area>
              <MantenimientoArea />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard-operacional"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ENFERMERO, ROLE.ADMIN, ROLE.SUPERADMIN]}>
            <LazyRoute area>
              <OperationalDashboard />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/modulos-estrategicos"
        element={(
          <ProtectedRoute>
            <LazyRoute area>
              <StrategicModulesHub />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/modulos/:moduleSlug"
        element={(
          <ProtectedRoute>
            <LazyRoute area>
              <StrategicModuleArea />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/modulos/:moduleSlug/:sectionKey"
        element={(
          <ProtectedRoute>
            <LazyRoute area>
              <StrategicModuleArea />
            </LazyRoute>
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
            <LazyRoute>
              <OrdenesMedicas />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/teleconsultas"
        element={(
          <ProtectedRoute allowedRoles={[ROLE.MEDICO, ROLE.ADMIN, ROLE.SUPERADMIN, ROLE.PACIENTE, ROLE.ENFERMERO, ROLE.SECRETARIA]}>
            <LazyRoute>
              <Teleconsultas />
            </LazyRoute>
          </ProtectedRoute>
        )}
      />
      <Route path="/medicos" element={<MedicosList />} />
      <Route path="/medicos/:id" element={<PaginaMedico />} />
      <Route path="/medico/:id" element={<PaginaPublicaMedico />} />
      <Route path="/demo" element={(isPublicDemoHost || isLocalDemoHost || isVercelHost) ? (
        <LazyRoute>
          <DemoLanding />
        </LazyRoute>
      ) : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
