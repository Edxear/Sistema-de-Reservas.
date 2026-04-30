import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIONS, EVENTS, Joyride, STATUS } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appendDemoAnalyticsEvent } from '../hooks/useDemoAnalytics';

const ADMIN_STEPS = [
  {
    route: '/dashboard',
    target: 'body',
    title: '📊 Panel de control',
    content: 'Vista general del sistema, métricas y acciones rápidas.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    route: '/gestion/medicos',
    target: '[data-tour="gestion-medicos-overview"]',
    title: '👨‍⚕️ Gestión de médicos',
    content: 'Aquí podés administrar el staff médico, especialidades y disponibilidad.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    route: '/gestion/pacientes',
    target: '[data-tour="gestion-pacientes-overview"]',
    title: '🧑‍🤝‍🧑 Gestión de pacientes',
    content: 'Alta, edición y consulta de fichas de pacientes y su información principal.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    route: '/pizarra',
    target: '[data-tour="pizarra-overview"]',
    title: '🛏️ Pizarra digital de camas',
    content: 'Estado en tiempo real de ocupación, limpieza, mantenimiento y reservas.',
    placement: 'bottom',
  },
  {
    route: '/ordenes-medicas',
    target: '[data-tour="ordenes-overview"]',
    title: '📋 Órdenes médicas',
    content: 'Creación y seguimiento de órdenes por prioridad, estado y resultado.',
    placement: 'bottom',
  },
  {
    route: '/soporte',
    target: '[data-tour="soporte-overview"]',
    title: '🎫 Centro de soporte',
    content: 'Gestión de tickets, SLA, usuarios y base de conocimiento interna.',
    placement: 'bottom',
  },
  {
    route: '/enfermeria',
    target: '[data-tour="enfermeria-overview"]',
    title: '🩺 Área de enfermería',
    content: 'Checklist, incidentes, iniciativas y tareas operativas de enfermería.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    route: '/teleconsultas',
    target: '[data-tour="teleconsultas-overview"]',
    title: '💬 Teleconsultas',
    content: 'Agenda y seguimiento de teleconsultas con profesionales y pacientes.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    route: '/organigrama',
    target: '[data-tour="organigrama-overview"]',
    title: '🏢 Organigrama',
    content: 'Visualización de estructura institucional y relaciones de áreas.',
    placement: 'bottom',
    disableBeacon: true,
  },
];

const PATIENT_STEPS = [
  {
    route: '/dashboard',
    target: 'body',
    title: '🏠 Inicio de paciente',
    content: 'Panel principal con accesos a turnos, teleconsultas y tu actividad.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    route: '/turnos',
    target: '[data-tour="turnos-overview"]',
    title: '📅 Mis turnos',
    content: 'Consultá, gestioná y revisá tu historial de turnos médicos.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    route: '/teleconsultas',
    target: '[data-tour="teleconsultas-overview"]',
    title: '💻 Teleconsultas',
    content: 'Accedé a consultas virtuales y al estado de cada encuentro.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    route: '/perfil',
    target: '[data-tour="perfil-overview"]',
    title: '👤 Mi perfil',
    content: 'Datos personales, cobertura y preferencias de cuenta.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    route: '/medicos',
    target: '[data-tour="medicos-list-overview"]',
    title: '🧑‍⚕️ Profesionales',
    content: 'Explorá médicos y especialistas disponibles para próximos turnos.',
    placement: 'bottom',
    disableBeacon: true,
  },
];

const getDoneKey = (role) => `demoTourDone:${role === 'paciente' ? 'paciente' : 'admin'}`;
const SESSION_KEY = 'demoTourState';
const RESET_KEY = 'demoTourResetNonce';

const saveTourState = (stepIndex, route) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ stepIndex, route }));
  } catch (_) {
    return;
  }
};

const loadTourState = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const clearTourState = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (_) {
    return;
  }
};

const trackTourStep = (demoRole, step, stepIndex, direction) => {
  appendDemoAnalyticsEvent({
    type: 'tour-step',
    role: demoRole === 'paciente' ? 'paciente' : 'admin',
    stepIndex,
    route: step?.route || '',
    target: step?.target || '',
    title: step?.title || '',
    direction,
    ts: new Date().toISOString(),
  });
};

export default function DemoTour() {
  const { demoMode, demoRole } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [resetNonce, setResetNonce] = useState(() => sessionStorage.getItem(RESET_KEY) || '');
  const retryTimerRef = useRef(null);
  const lastHandledResetNonceRef = useRef('');
  const steps = useMemo(
    () => (demoRole === 'paciente' ? PATIENT_STEPS : ADMIN_STEPS),
    [demoRole],
  );
  const tourSteps = useMemo(
    () => steps.map((step) => ({ ...step, disableBeacon: true })),
    [steps],
  );
  const [run, setRun] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setResetNonce(sessionStorage.getItem(RESET_KEY) || '');
    };

    window.addEventListener('demo-tour-reset', handleStorage);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);
    return () => {
      window.removeEventListener('demo-tour-reset', handleStorage);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const goToStepRoute = (index) => {
    const step = steps[index];
    if (!step?.route) return;
    if (pathname !== step.route) {
      navigate(step.route);
    }
  };

  useEffect(() => {
    if (!demoMode) {
      setRun(false);
      setStepIndex(0);
      return;
    }

    if (resetNonce && resetNonce !== lastHandledResetNonceRef.current) {
      lastHandledResetNonceRef.current = resetNonce;
      setStepIndex(0);
      saveTourState(0, steps[0]?.route);
      setRun(true);
      if (steps[0]?.route && pathname !== steps[0].route) {
        navigate(steps[0].route);
      }
      return;
    }

    const done = localStorage.getItem(getDoneKey(demoRole)) === 'true';
    if (!done) {
      const saved = loadTourState();
      if (saved && typeof saved.stepIndex === 'number' && saved.stepIndex < steps.length) {
        const currentRouteIndex = steps.findIndex((step) => step.route === pathname);

        // Prefer current route to avoid rebounding to an older saved route.
        if (currentRouteIndex >= 0) {
          setStepIndex(currentRouteIndex);
          saveTourState(currentRouteIndex, steps[currentRouteIndex]?.route);
          setRun((wasRunning) => wasRunning || currentRouteIndex === 0);
        } else {
          // Keep saved index without forcing navigation outside the current route.
          setStepIndex(saved.stepIndex);
          setRun(false);
        }
      } else {
        const currentRouteIndex = steps.findIndex((step) => step.route === pathname);

        if (currentRouteIndex >= 0) {
          setStepIndex(currentRouteIndex);
          saveTourState(currentRouteIndex, steps[currentRouteIndex]?.route);
          setRun((wasRunning) => wasRunning || currentRouteIndex === 0);
        } else {
          setStepIndex(0);
          setRun(pathname === steps[0]?.route);
        }
      }
    } else {
      setRun(false);
    }
  }, [demoMode, demoRole, navigate, pathname, resetNonce, steps]);

  if (!demoMode) return null;

  const handleCallback = ({ action, index, status, type }) => {
    const doneKey = getDoneKey(demoRole);

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem(doneKey, 'true');
      clearTourState();
      setRun(false);
      setStepIndex(0);
      navigate('/dashboard');
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        const nextIndex = Math.min(index + 1, steps.length - 1);
        setStepIndex(nextIndex);
        saveTourState(nextIndex, steps[nextIndex]?.route);
        trackTourStep(demoRole, steps[nextIndex], nextIndex, 'next');
        goToStepRoute(nextIndex);
      }
      if (action === ACTIONS.PREV) {
        const prevIndex = Math.max(index - 1, 0);
        setStepIndex(prevIndex);
        saveTourState(prevIndex, steps[prevIndex]?.route);
        trackTourStep(demoRole, steps[prevIndex], prevIndex, 'prev');
        goToStepRoute(prevIndex);
      }
    }

    if (type === EVENTS.TARGET_NOT_FOUND) {
      // Retry the same step in case the target is still mounting (lazy/async pages).
      const safeIndex = Math.max(0, Math.min(index, steps.length - 1));
      const safeRoute = steps[safeIndex]?.route;

      setRun(false);
      setStepIndex(safeIndex);
      saveTourState(safeIndex, safeRoute || pathname);

      if (safeRoute && pathname !== safeRoute) {
        navigate(safeRoute);
      }

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }

      retryTimerRef.current = setTimeout(() => {
        setStepIndex(safeIndex);
        setRun(true);
      }, 350);
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      stepIndex={stepIndex}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      locale={{
        back: 'Anterior',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        open: 'Abrir',
        skip: 'Saltear tour',
      }}
      styles={{
        options: {
          primaryColor: '#1e5a7a',
          zIndex: 10000,
          arrowColor: '#fff',
          backgroundColor: '#fff',
          textColor: '#1a2c3d',
        },
        buttonNext: {
          background: 'linear-gradient(135deg, #1e5a7a, #2980b9)',
          borderRadius: 8,
          fontWeight: 700,
        },
        buttonBack: {
          color: '#1e5a7a',
          fontWeight: 600,
        },
        buttonSkip: {
          color: '#6b7280',
        },
      }}
    />
  );
}
