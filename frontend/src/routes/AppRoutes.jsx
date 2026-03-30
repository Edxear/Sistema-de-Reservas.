import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE } from '../utils/roles';

import LoginRegister from '../pages/auth/LoginRegister';
import Dashboard from '../pages/app/Dashboard';
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
import Organigrama from '../pages/organizacion/Organigrama';
import Soporte from '../pages/soporte/Soporte';

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando sesion...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.rol === ROLE.SUPERADMIN) {
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando sesion...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
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
            <Dashboard />
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
      <Route path="/medicos" element={<MedicosList />} />
      <Route path="/medicos/:id" element={<PaginaMedico />} />
      <Route path="/medico/:id" element={<PaginaPublicaMedico />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
