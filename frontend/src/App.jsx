import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importar los Providers
import { AuthProvider } from './context/AuthContext';
import { NotificacionProvider } from './context/NotificacionContext';

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

function ScrollRestorationManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  React.useEffect(() => {
    const key = `scroll:${location.pathname}${location.search}`;

    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const y = Number(saved);
        if (!Number.isNaN(y)) {
          requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'auto' }));
        }
      }
    }

    return () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
  }, [location.pathname, location.search, navigationType]);

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
      {/* AuthProvider y NotificacionProvider envuelven toda la app */}
      <AuthProvider>
        <NotificacionProvider>
          <ScrollRestorationManager />
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
        </NotificacionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;