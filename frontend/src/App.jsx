import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Componente para proteger rutas (opcional pero muy útil)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Componente para redirigir si ya está logueado
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
          <Route path="/medico/:id" element={<PaginaPublicaMedico />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;