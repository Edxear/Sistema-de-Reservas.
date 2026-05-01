import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './DemoBanner.module.css';

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
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.icon}>🧪</span>
        <span className={styles.badge}>MODO DEMO</span>
        <span className={styles.message}>Datos ficticios — solo para demostración. No se realizan acciones reales.</span>
      </div>
      <div className={styles.actions}>
        <button
          onClick={handleExit}
          className={styles.exitButton}
        >
          Salir del demo
        </button>
        <button
          onClick={handleDismiss}
          className={styles.closeButton}
          aria-label="Cerrar aviso"
        >
          ×
        </button>
      </div>
    </div>
  );
}
