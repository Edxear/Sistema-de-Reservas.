import React from 'react';
import { BrowserRouter as Router, useLocation, useNavigationType } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ErrorBoundary from './components/ErrorBoundary';
// Importar los Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificacionProvider } from './context/NotificacionContext';
import { ThemeProvider } from './context/ThemeContext';

import Header from './components/Header';
import AppRoutes from './routes/AppRoutes';
import DemoBanner from './components/DemoBanner';
import DemoPageTip from './components/DemoPageTip';
import DemoTourCustom from './components/DemoTourCustom';
import OfflineIndicator from './components/OfflineIndicator';
import { useDemoAnalytics } from './hooks/useDemoAnalytics';

const DEMO_SUPPRESSED_TOAST_PATTERNS = [
  'no se pudo cargar',
  'no se pudieron cargar',
  'error al cargar',
  'error cargando',
  'no se encontro',
  'no se encontró',
  'failed to fetch',
  'network error',
  'se muestra el ejemplo local',
];

const normalizeToastMessage = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

function DemoToastFilter() {
  const { demoMode } = useAuth();

  React.useEffect(() => {
    const originalError = toast.error;
    const originalWarn = toast.warn;
    const shouldSuppressToast = (content) => {
      if (!demoMode) return false;

      const message = normalizeToastMessage(
        typeof content === 'string' ? content : content?.props?.children,
      );

      return DEMO_SUPPRESSED_TOAST_PATTERNS.some((pattern) => message.includes(pattern));
    };

    toast.error = (content, options) => {
      if (shouldSuppressToast(content)) {
        return null;
      }

      return originalError(content, options);
    };

    toast.warn = (content, options) => {
      if (shouldSuppressToast(content)) {
        return null;
      }

      return originalWarn(content, options);
    };

    return () => {
      toast.error = originalError;
      toast.warn = originalWarn;
    };
  }, [demoMode]);

  return null;
}

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

function DemoAnalyticsTracker() {
  useDemoAnalytics();
  return null;
}

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const onChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  return isMobile;
}

function App() {
  const isMobileViewport = useIsMobileViewport();

  return (
    <ThemeProvider>
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <NotificacionProvider>
            <DemoToastFilter />
            <ScrollRestorationManager />
            <DemoAnalyticsTracker />
            <DemoPageTip />
            <OfflineIndicator />
            <Header />
            <DemoTourCustom />
            <ToastContainer
              position={isMobileViewport ? 'top-center' : 'top-right'}
              autoClose={3000}
              className={isMobileViewport ? 'mobile-toast-container' : undefined}
              toastClassName={isMobileViewport ? 'mobile-toast' : undefined}
              style={isMobileViewport ? { top: 'calc(62px + env(safe-area-inset-top, 0px))' } : undefined}
            />
            <AppRoutes />
            <DemoBanner />
          </NotificacionProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;