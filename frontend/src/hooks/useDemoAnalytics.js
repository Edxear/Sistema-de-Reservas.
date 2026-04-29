import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useDemoAnalytics() {
  const { demoMode } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!demoMode) return;
    try {
      const log = JSON.parse(localStorage.getItem('demoAnalytics') || '[]');
      log.push({ path: location.pathname, ts: new Date().toISOString() });
      localStorage.setItem('demoAnalytics', JSON.stringify(log.slice(-100)));
    } catch {
      // Silently ignore storage errors
    }
  }, [location.pathname, demoMode]);
}
