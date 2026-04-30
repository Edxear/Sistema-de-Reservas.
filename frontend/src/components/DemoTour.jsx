import React, { useEffect, useMemo, useState } from 'react';
import { ACTIONS, EVENTS, Joyride, STATUS } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_STEPS = [
  {
    route: '/dashboard',
    target: '[data-tour="dashboard-overview"]',
    title: '📊 Panel de control',
    content: 'Vista general del sistema, métricas y acciones rápidas.',
    placement: 'bottom',
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
    target: '[data-tour="dashboard-overview"]',
    title: '🏠 Inicio de paciente',
    content: 'Panel principal con accesos a turnos, teleconsultas y tu actividad.',
    placement: 'bottom',
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

export default function DemoTour() {
  const { demoMode, demoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(
    () => (demoRole === 'paciente' ? PATIENT_STEPS : ADMIN_STEPS),
    [demoRole],
  );
  const [run, setRun] = useState(false);

  const goToStepRoute = (index) => {
    const step = steps[index];
    if (!step?.route) return;
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  };

  useEffect(() => {
    if (!demoMode) {
      setRun(false);
      setStepIndex(0);
      return;
    }

    const done = localStorage.getItem(getDoneKey(demoRole)) === 'true';
    if (!done) {
      setStepIndex(0);
      setRun(true);
      const firstRoute = steps[0]?.route;
      if (firstRoute && location.pathname !== firstRoute) {
        navigate(firstRoute);
      }
    } else {
      setRun(false);
    }
  }, [demoMode, demoRole, navigate, steps]);

  if (!demoMode) return null;

  const handleCallback = ({ action, index, status, type }) => {
    const doneKey = getDoneKey(demoRole);

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem(doneKey, 'true');
      setRun(false);
      setStepIndex(0);
      navigate('/dashboard');
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        const nextIndex = Math.min(index + 1, steps.length - 1);
        setStepIndex(nextIndex);
        goToStepRoute(nextIndex);
      }
      if (action === ACTIONS.PREV) {
        const prevIndex = Math.max(index - 1, 0);
        setStepIndex(prevIndex);
        goToStepRoute(prevIndex);
      }
    }

    if (type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.PREV) {
        const prevIndex = Math.max(index - 1, 0);
        setStepIndex(prevIndex);
        goToStepRoute(prevIndex);
        return;
      }

      const nextIndex = Math.min(index + 1, steps.length - 1);
      if (nextIndex === index) {
        localStorage.setItem(doneKey, 'true');
        setRun(false);
        return;
      }
      setStepIndex(nextIndex);
      goToStepRoute(nextIndex);
    }
  };

  return (
    <Joyride
      steps={steps}
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
