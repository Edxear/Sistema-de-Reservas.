import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importar el Provider de Autenticación
import { AuthProvider } from './context/AuthContext';

// Importar los componentes de las páginas
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import PaginaPublicaMedico from './components/PaginaPublicaMedico';
import HistoriaClinica from './components/HistoriaClinica';
import Recetas from './components/Recetas';
import Header from './components/Header';
import Perfil from './components/Perfil';
import Turnos from './components/Turnos';
import PacienteDetalle from './components/PacienteDetalle';

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

// Componente para proteger rutas. Redirige a login si no está autenticado.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Componente para redirigir si ya está logueado. Redirige a dashboard si está autenticado.
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      {/* AuthProvider envuelve toda la app para que el contexto esté disponible */}
      <AuthProvider>
        <ScrollToTop />
        <Header />
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginRegister />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/historial/:pacienteId" element={
            <ProtectedRoute>
              <HistoriaClinica />
            </ProtectedRoute>
          } />
          <Route path="/recetas" element={
            <ProtectedRoute>
              <Recetas />
            </ProtectedRoute>
          } />
          <Route path="/perfil" element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          } />
          <Route path="/turnos" element={
            <ProtectedRoute>
              <Turnos />
            </ProtectedRoute>
          } />
          <Route path="/pacientes/:pacienteId" element={
            <ProtectedRoute>
              <PacienteDetalle />
            </ProtectedRoute>
          } />
          <Route path="/medico/:id" element={<PaginaPublicaMedico />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;