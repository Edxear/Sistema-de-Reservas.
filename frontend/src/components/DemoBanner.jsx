import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DemoBanner() {
  const { demoMode, setDemoMode } = useAuth();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('demoBannerDismissed') === 'true');
  const navigate = useNavigate();

  if (!demoMode || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('demoBannerDismissed', 'true');
    setDismissed(true);
  };

  const handleExit = () => {
    setDemoMode(false);
    navigate('/login');
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(90deg, #1e3a4f 0%, #1e5a7a 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '10px 20px',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.35)',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '1rem' }}>🧪</span>
      <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
        MODO DEMO
      </span>
      <span style={{ fontSize: '0.85rem', color: '#a5c8e4' }}>
        Datos ficticios — solo para demostración. No se realizan acciones reales.
      </span>
      <button
        onClick={handleExit}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          borderRadius: 6,
          padding: '4px 12px',
          fontSize: '0.8rem',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Salir del demo
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#a5c8e4',
          cursor: 'pointer',
          fontSize: '1.1rem',
          lineHeight: 1,
          padding: '0 4px',
        }}
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </div>
  );
}
