import React, { useEffect, useMemo, useState } from 'react';
import { ACTIONS, EVENTS, Joyride, STATUS } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TOUR_STEPS = [
  {
    route: '/dashboard',
    target: '[data-tour="dashboard-overview"]',
    title: '📊 Panel de control',
    content: 'Desde aquí tenés una visión general de métricas clave: médicos, pacientes, camas y turnos del día.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    route: '/pizarra',
    target: '[data-tour="pizarra-overview"]',
    title: '🛏️ Pizarra digital de camas',
    content: 'Visualizá el estado de todas las camas en tiempo real: libres, ocupadas, en limpieza o aislamiento.',
    placement: 'bottom',
  },
  {
    route: '/ordenes-medicas',
    target: '[data-tour="ordenes-overview"]',
    title: '📋 Órdenes médicas',
    content: 'Emitir, confirmar y dar seguimiento a órdenes médicas de laboratorio, imágenes y procedimientos.',
    placement: 'bottom',
  },
  {
    route: '/soporte',
    target: '[data-tour="soporte-overview"]',
    title: '🎫 Soporte y tickets',
    content: 'Sistema de tickets para gestionar incidentes clínicos, requerimientos y escalamientos.',
    placement: 'bottom',
  },
];

export default function DemoTour() {
  const { demoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(() => {
    return demoMode && localStorage.getItem('demoTourDone') !== 'true';
  });
  const currentStep = useMemo(() => TOUR_STEPS[stepIndex], [stepIndex]);

  useEffect(() => {
    if (!demoMode || !run || !currentStep) return;
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [currentStep, demoMode, location.pathname, navigate, run]);

  if (!demoMode) return null;

  const handleCallback = ({ action, index, status, type }) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem('demoTourDone', 'true');
      setRun(false);
      setStepIndex(0);
      navigate('/dashboard');
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.NEXT) {
        setStepIndex((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
      }
      if (action === ACTIONS.PREV) {
        setStepIndex((prev) => Math.max(prev - 1, 0));
      }
    }

    if (type === EVENTS.TARGET_NOT_FOUND && index === TOUR_STEPS.length - 1) {
      localStorage.setItem('demoTourDone', 'true');
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
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
