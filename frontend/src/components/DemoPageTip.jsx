import React from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const DEMO_TIP_ROUTES = [
  {
    pattern: '/dashboard',
    messageByRole: {
      admin: 'Tip demo: desde este panel podes abrir gestion, soporte y seguimiento operativo.',
      paciente: 'Tip demo: desde aqui podes revisar tu proximo turno, teleconsultas y accesos rapidos.',
    },
  },
  {
    pattern: '/gestion/medicos',
    messageByRole: {
      admin: 'Tip demo: proba filtros, alta de profesionales y cambios de disponibilidad sin afectar datos reales.',
    },
  },
  {
    pattern: '/gestion/pacientes',
    messageByRole: {
      admin: 'Tip demo: esta vista concentra altas, busqueda y acceso a fichas clinicas simuladas.',
    },
  },
  {
    pattern: '/turnos',
    messageByRole: {
      admin: 'Tip demo: revisa reservas, estado y filtros para simular operacion diaria.',
      paciente: 'Tip demo: aca podes gestionar tus turnos y revisar reservas futuras o anteriores.',
    },
  },
  {
    pattern: '/teleconsultas',
    messageByRole: {
      admin: 'Tip demo: usa esta vista para seguir estado, agenda y salas de teleconsulta.',
      paciente: 'Tip demo: en esta vista podes entrar a tus consultas virtuales y ver su estado.',
    },
  },
  {
    pattern: '/perfil',
    messageByRole: {
      admin: 'Tip demo: el perfil permite revisar configuracion personal sin persistencia real.',
      paciente: 'Tip demo: revisa datos personales y cobertura; los cambios son solo simulados.',
    },
  },
  {
    pattern: '/soporte',
    messageByRole: {
      admin: 'Tip demo: soporte incluye tickets, SLA y base de conocimiento con datos de ejemplo.',
    },
  },
  {
    pattern: '/pizarra',
    messageByRole: {
      admin: 'Tip demo: la pizarra muestra ocupacion y estado operativo de camas en tiempo real simulado.',
    },
  },
  {
    pattern: '/ordenes-medicas',
    messageByRole: {
      admin: 'Tip demo: revisa prioridades, estados y seguimiento de ordenes medicas de ejemplo.',
    },
  },
  {
    pattern: '/enfermeria',
    messageByRole: {
      admin: 'Tip demo: aqui podes explorar checklists, incidentes e iniciativas operativas de enfermeria.',
    },
  },
  {
    pattern: '/organigrama',
    messageByRole: {
      admin: 'Tip demo: el organigrama ayuda a mostrar estructura institucional y responsables por area.',
    },
  },
  {
    pattern: '/medicos',
    allowPrefix: true,
    messageByRole: {
      admin: 'Tip demo: esta lista publica sirve para explorar perfiles y especialidades disponibles.',
      paciente: 'Tip demo: explora profesionales, especialidades y perfiles antes de reservar un turno.',
    },
  },
];

const matchesRoute = (pathname, pattern, allowPrefix = false) => {
  if (allowPrefix) {
    return pathname === pattern || pathname.startsWith(`${pattern}/`);
  }

  return pathname === pattern;
};

const getDemoTipMessage = (pathname, demoRole) => {
  const roleKey = demoRole === 'paciente' ? 'paciente' : 'admin';
  const match = DEMO_TIP_ROUTES.find((route) => matchesRoute(pathname, route.pattern, route.allowPrefix));
  return match?.messageByRole?.[roleKey] || null;
};

export default function DemoPageTip() {
  const { demoMode, demoRole } = useAuth();
  const location = useLocation();
  const lastShownRef = React.useRef('');

  React.useEffect(() => {
    if (!demoMode) {
      lastShownRef.current = '';
      return;
    }

    const message = getDemoTipMessage(location.pathname, demoRole);
    if (!message) {
      return;
    }

    const routeKey = `${demoRole}:${location.pathname}`;
    if (lastShownRef.current === routeKey) {
      return;
    }

    lastShownRef.current = routeKey;
    toast.info(message, {
      toastId: 'demo-page-tip',
      autoClose: 5000,
    });
  }, [demoMode, demoRole, location.pathname]);

  return null;
}