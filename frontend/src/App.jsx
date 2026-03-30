import React from 'react';
import { BrowserRouter as Router, useLocation, useNavigationType } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importar los Providers
import { AuthProvider } from './context/AuthContext';
import { NotificacionProvider } from './context/NotificacionContext';

import Header from './components/Header';
import AppRoutes from './routes/AppRoutes';

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

function App() {
  return (
    <Router>
      {/* AuthProvider y NotificacionProvider envuelven toda la app */}
      <AuthProvider>
        <NotificacionProvider>
          <ScrollRestorationManager />
          <Header />
          <ToastContainer position="top-right" autoClose={3000} />
          <AppRoutes />
        </NotificacionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;