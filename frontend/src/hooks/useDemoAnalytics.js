import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ANALYTICS_KEY = 'demoAnalytics';

export const appendDemoAnalyticsEvent = (event) => {
  try {
    const log = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
    log.push(event);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(log.slice(-150)));
  } catch {
    return;
  }
};

export function useDemoAnalytics() {
  const { demoMode, demoRole } = useAuth();
  const location = useLocation();
  const routeStartRef = useRef(null);

  useEffect(() => {
    if (!demoMode) {
      routeStartRef.current = null;
      return;
    }

    const enteredAt = new Date();
    const currentPath = location.pathname;
    routeStartRef.current = {
      path: currentPath,
      enteredAt,
    };

    appendDemoAnalyticsEvent({
      type: 'screen-view',
      role: demoRole === 'paciente' ? 'paciente' : 'admin',
      path: currentPath,
      enteredAt: enteredAt.toISOString(),
      ts: enteredAt.toISOString(),
    });

    return () => {
      const started = routeStartRef.current;
      if (!started || started.path !== currentPath) {
        return;
      }

      const leftAt = new Date();
      appendDemoAnalyticsEvent({
        type: 'screen-duration',
        role: demoRole === 'paciente' ? 'paciente' : 'admin',
        path: currentPath,
        enteredAt: started.enteredAt.toISOString(),
        leftAt: leftAt.toISOString(),
        durationMs: Math.max(0, leftAt.getTime() - started.enteredAt.getTime()),
        ts: leftAt.toISOString(),
      });
    };
  }, [location.pathname, demoMode, demoRole]);
}
