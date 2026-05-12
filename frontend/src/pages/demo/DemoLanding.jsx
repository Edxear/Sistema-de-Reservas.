import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  {
    key: 'admin',
    icon: '🏥',
    title: 'Vista Administrativo',
    subtitle: 'Acceso completo al sistema',
    description: 'Gestión de médicos, pacientes, turnos, soporte, pizarra de camas, órdenes médicas, enfermería y organigrama.',
    color: '#1e5a7a',
    bg: 'linear-gradient(135deg, #1e5a7a 0%, #2980b9 100%)',
    features: ['Panel de métricas', 'Gestión de médicos y pacientes', 'Pizarra de camas', 'Soporte y tickets', 'Enfermería', 'Organigrama'],
  },
  {
    key: 'paciente',
    icon: '🧑‍⚕️',
    title: 'Vista Paciente',
    subtitle: 'Experiencia del paciente',
    description: 'Reserva de turnos, historial de citas, recetas digitales y teleconsultas desde la perspectiva del paciente.',
    color: '#065f46',
    bg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    features: ['Mis turnos', 'Mis recetas', 'Teleconsultas', 'Mi perfil', 'Notificaciones'],
  },
];

export default function DemoLanding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setDemoMode, setDemoRole } = useAuth();

  const handleSelect = (roleKey) => {
    // Clear any prior tour state so the tour always restarts after role selection.
    localStorage.removeItem(`demoTourDone:${roleKey}`);
    sessionStorage.removeItem(`demoTourState:${roleKey}`);
    sessionStorage.setItem('demoTourResetNonce', String(Date.now()));
    setDemoMode(true);
    setDemoRole(roleKey);
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f2942 0%, #1e5a7a 50%, #2980b9 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Open Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', color: '#fff' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🩺</div>
        <h1 style={{ margin: '0 0 8px', fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
          {t('demo.title', 'IntegraSalud')}
        </h1>
        <p style={{ margin: 0, fontSize: '1.1rem', color: '#a5c8e4', maxWidth: 480 }}>
          {t('demo.subtitle', 'Explora el sistema como Administrativo o como Paciente.')}
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 99,
          padding: '6px 16px',
          marginTop: 16,
          fontSize: '0.85rem',
          color: '#fbbf24',
          fontWeight: 600,
        }}>
          {t('demo.badge', 'Seleccion de perfil de acceso')}
        </div>
      </div>

      {/* Role cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: 720,
        width: '100%',
      }}>
        {ROLES.map((role) => (
          <button
            key={role.key}
            type="button"
            onClick={() => handleSelect(role.key)}
            style={{
              background: '#fff',
              border: 'none',
              borderRadius: '16px',
              padding: '32px 28px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)'; }}
          >
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: role.bg, borderRadius: '16px 16px 0 0' }} />

            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{role.icon}</div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: '800', color: role.color }}>{role.title}</h2>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', fontWeight: '600', color: '#6b7280' }}>{role.subtitle}</p>
            <p style={{ margin: '0 0 20px', fontSize: '0.92rem', color: '#374151', lineHeight: 1.5 }}>{role.description}</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {role.features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#374151' }}>
                  <span style={{ color: role.color, fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <div style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: role.bg,
              color: '#fff',
              borderRadius: 10,
              padding: '12px',
              fontWeight: '700',
              fontSize: '1rem',
            }}>
              {t('demo.exploreAs', 'Explorar como')} {role.key === 'admin' ? t('roles.admin', 'Administrativo') : t('roles.paciente', 'Paciente')} →
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, color: '#a5c8e4', fontSize: '0.8rem', textAlign: 'center' }}>
        {t('demo.haveCredentials', '¿Tenés credenciales de acceso?')}{' '}
        <a href="/login" style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline' }}>{t('auth.login', 'Iniciar sesión')}</a>
      </div>
    </div>
  );
}
