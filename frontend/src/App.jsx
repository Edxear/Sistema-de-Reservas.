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
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const entryKey = location.key || `${location.pathname}${location.search}`;
    const key = `scroll:${entryKey}`;

    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const y = Number(saved);
        if (!Number.isNaN(y)) {
          requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'auto' }));
        }
      }
    }

    let ticking = false;
    const persistScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem(key, String(window.scrollY));
        ticking = false;
      });
    };

    window.addEventListener('scroll', persistScroll, { passive: true });
    window.addEventListener('beforeunload', persistScroll);

    return () => {
      window.removeEventListener('scroll', persistScroll);
      window.removeEventListener('beforeunload', persistScroll);
    };
  }, [location.key, location.pathname, location.search, navigationType]);

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