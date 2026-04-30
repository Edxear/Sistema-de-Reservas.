import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appendDemoAnalyticsEvent } from '../hooks/useDemoAnalytics';
import './DemoTourCustom.css';

const ADMIN_STEPS = [
  {
    route: '/dashboard',
    target: '[data-tour="dashboard-overview"]',
    title: '📊 Panel de control',
    content: 'Vista general del sistema, métricas y acciones rápidas.',
  },
  {
    route: '/gestion/medicos',
    target: '[data-tour="gestion-medicos-overview"]',
    title: '👨‍⚕️ Gestión de médicos',
    content: 'Aquí podés administrar el staff médico, especialidades y disponibilidad.',
  },
  {
    route: '/gestion/pacientes',
    target: '[data-tour="gestion-pacientes-overview"]',
    title: '🧑‍🤝‍🧑 Gestión de pacientes',
    content: 'Alta, edición y consulta de fichas de pacientes y su información principal.',
  },
  {
    route: '/pizarra',
    target: '[data-tour="pizarra-overview"]',
    title: '🛏️ Pizarra digital de camas',
    content: 'Estado en tiempo real de ocupación, limpieza, mantenimiento y reservas.',
  },
  {
    route: '/ordenes-medicas',
    target: '[data-tour="ordenes-overview"]',
    title: '📋 Órdenes médicas',
    content: 'Creación y seguimiento de órdenes por prioridad, estado y resultado.',
  },
  {
    route: '/soporte',
    target: '[data-tour="soporte-overview"]',
    title: '🎫 Centro de soporte',
    content: 'Gestión de tickets, SLA, usuarios y base de conocimiento interna.',
  },
  {
    route: '/enfermeria',
    target: '[data-tour="enfermeria-overview"]',
    title: '🩺 Área de enfermería',
    content: 'Checklist, incidentes, iniciativas y tareas operativas de enfermería.',
  },
  {
    route: '/teleconsultas',
    target: '[data-tour="teleconsultas-overview"]',
    title: '💬 Teleconsultas',
    content: 'Agenda y seguimiento de teleconsultas con profesionales y pacientes.',
  },
  {
    route: '/organigrama',
    target: '[data-tour="organigrama-overview"]',
    title: '🏢 Organigrama',
    content: 'Visualización de estructura institucional y relaciones de áreas.',
  },
];

const PATIENT_STEPS = [
  {
    route: '/dashboard',
    target: '[data-tour="dashboard-overview"]',
    title: '🏠 Inicio de paciente',
    content: 'Panel principal con accesos a turnos, teleconsultas y tu actividad.',
  },
  {
    route: '/turnos',
    target: '[data-tour="turnos-overview"]',
    title: '📅 Mis turnos',
    content: 'Consultá, gestioná y revisá tu historial de turnos médicos.',
  },
  {
    route: '/teleconsultas',
    target: '[data-tour="teleconsultas-overview"]',
    title: '💻 Teleconsultas',
    content: 'Accedé a consultas virtuales y al estado de cada encuentro.',
  },
  {
    route: '/perfil',
    target: '[data-tour="perfil-overview"]',
    title: '👤 Mi perfil',
    content: 'Datos personales, cobertura y preferencias de cuenta.',
  },
  {
    route: '/medicos',
    target: '[data-tour="medicos-list-overview"]',
    title: '🧑‍⚕️ Profesionales',
    content: 'Explorá médicos y especialistas disponibles para próximos turnos.',
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

export default function DemoTourCustom() {
  const { demoMode, demoRole } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [resetNonce, setResetNonce] = useState(() => sessionStorage.getItem(RESET_KEY) || '');
  const lastHandledResetNonceRef = useRef('');

  const steps = useMemo(
    () => (demoRole === 'paciente' ? PATIENT_STEPS : ADMIN_STEPS),
    [demoRole],
  );

  const currentStep = steps[stepIndex] || steps[0];

  // Storage event listener para reset
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

  const goToStepRoute = (index) => {
    const step = steps[index];
    if (!step?.route) return;
    if (pathname !== step.route) {
      navigate(step.route);
    }
  };

  // Inicialización del tour
  useEffect(() => {
    if (!demoMode) {
      setIsVisible(false);
      setStepIndex(0);
      return;
    }

    if (resetNonce && resetNonce !== lastHandledResetNonceRef.current) {
      lastHandledResetNonceRef.current = resetNonce;
      localStorage.removeItem(getDoneKey(demoRole));
      setStepIndex(0);
      saveTourState(0, steps[0]?.route);
      setIsVisible(true);
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
        if (currentRouteIndex >= 0) {
          setStepIndex(currentRouteIndex);
          saveTourState(currentRouteIndex, steps[currentRouteIndex]?.route);
          setIsVisible(true);
        } else {
          setStepIndex(saved.stepIndex);
          setIsVisible(true);
        }
      } else {
        const currentRouteIndex = steps.findIndex((step) => step.route === pathname);
        if (currentRouteIndex >= 0) {
          setStepIndex(currentRouteIndex);
          saveTourState(currentRouteIndex, steps[currentRouteIndex]?.route);
          setIsVisible(true);
        } else {
          setStepIndex(0);
          setIsVisible(true);
        }
      }
    } else {
      setIsVisible(false);
    }
  }, [demoMode, demoRole, navigate, pathname, resetNonce, steps]);

  const handleNext = () => {
    if (stepIndex >= steps.length - 1) {
      // Tour finished
      localStorage.setItem(getDoneKey(demoRole), 'true');
      clearTourState();
      setIsVisible(false);
      setStepIndex(0);
      navigate('/dashboard');
      return;
    }

    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    saveTourState(nextIndex, steps[nextIndex]?.route);
    trackTourStep(demoRole, steps[nextIndex], nextIndex, 'next');
    goToStepRoute(nextIndex);
  };

  const handlePrev = () => {
    if (stepIndex <= 0) return;

    const prevIndex = stepIndex - 1;
    setStepIndex(prevIndex);
    saveTourState(prevIndex, steps[prevIndex]?.route);
    trackTourStep(demoRole, steps[prevIndex], prevIndex, 'prev');
    goToStepRoute(prevIndex);
  };

  const handleClose = () => {
    localStorage.setItem(getDoneKey(demoRole), 'true');
    clearTourState();
    setIsVisible(false);
    setStepIndex(0);
  };

  const handleReopen = () => {
    localStorage.removeItem(getDoneKey(demoRole));
    const currentRouteIndex = steps.findIndex((step) => step.route === pathname);
    const nextIndex = currentRouteIndex >= 0 ? currentRouteIndex : 0;
    setStepIndex(nextIndex);
    saveTourState(nextIndex, steps[nextIndex]?.route);
    setIsVisible(true);
    if (currentRouteIndex < 0 && steps[0]?.route) {
      navigate(steps[0].route);
    }
  };

  const isOnDashboard = pathname === '/dashboard';

  if (!demoMode) return null;

  const targetElement = currentStep.target ? document.querySelector(currentStep.target) : null;
  const rect = targetElement ? targetElement.getBoundingClientRect() : null;

  return (
    <>
      {/* Beacon/Indicator button — solo visible en el dashboard */}
      {!isVisible && isOnDashboard && (
        <button
          className="demo-tour-beacon"
          onClick={handleReopen}
          data-testid="button-beacon"
          title="Abrir tour"
          aria-label="Abrir tour"
        >
          ℹ️
        </button>
      )}

      {/* Custom Tour Modal */}
      {isVisible && (
        <div className="demo-tour-overlay">
          <div className="demo-tour-modal" role="alertdialog" aria-labelledby="tour-title" aria-describedby="tour-content">
            <div className="demo-tour-modal-header">
              <h4 id="tour-title">{currentStep.title}</h4>
              <button
                className="demo-tour-close-btn"
                onClick={handleClose}
                aria-label="Cerrar tour"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="demo-tour-modal-body">
              <p id="tour-content">{currentStep.content}</p>
            </div>

            <div className="demo-tour-modal-footer">
              <div className="demo-tour-progress">
                Paso {stepIndex + 1} de {steps.length}
              </div>

              <div className="demo-tour-buttons">
                <button
                  className="demo-tour-btn demo-tour-btn-secondary"
                  onClick={handlePrev}
                  disabled={stepIndex === 0}
                  aria-label="Anterior"
                >
                  Anterior
                </button>

                <button
                  className="demo-tour-btn demo-tour-btn-primary"
                  onClick={handleNext}
                  data-testid="button-primary"
                  aria-label={stepIndex >= steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                >
                  {stepIndex >= steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                </button>
              </div>
            </div>
          </div>

          {/* Highlight box around target element */}
          {rect && (
            <div
              className="demo-tour-highlight"
              style={{
                top: `${rect.top - 5}px`,
                left: `${rect.left - 5}px`,
                width: `${rect.width + 10}px`,
                height: `${rect.height + 10}px`,
              }}
            />
          )}

          {/* Overlay backdrop */}
          <div className="demo-tour-backdrop" onClick={handleClose} />
        </div>
      )}
    </>
  );
}
