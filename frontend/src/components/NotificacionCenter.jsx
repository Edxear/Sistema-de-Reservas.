import React, { useState, useRef, useEffect } from 'react';
import { useNotificaciones } from '../context/NotificacionContext';
import styles from './NotificacionCenter.module.css';

export default function NotificacionCenter() {
  const { notificaciones, noLeidas, marcarComoLeida, marcarTodoComoLeido } =
    useNotificaciones();
  const [abierto, setAbierto] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickAfuera(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAbierto(false);
      }
    }

    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      return () => document.removeEventListener('mousedown', handleClickAfuera);
    }
  }, [abierto]);

  const handleMarcarComoLeida = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    marcarComoLeida(id);
  };

  const handleNavegar = (enlace) => {
    if (enlace) {
      window.location.href = enlace;
      setAbierto(false);
    }
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* Campana */}
      <button
        className={styles.campana}
        onClick={() => setAbierto(!abierto)}
        title="Notificaciones"
      >
        🔔
        {noLeidas > 0 && <span className={styles.badge}>{noLeidas}</span>}
      </button>

      {/* Dropdown */}
      {abierto && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                className={styles.marcarTodas}
                onClick={() => {
                  marcarTodoComoLeido();
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className={styles.lista}>
            {notificaciones.length === 0 ? (
              <p className={styles.vacio}>No hay notificaciones</p>
            ) : (
              notificaciones.map((notif) => (
                <div
                  key={notif._id}
                  className={`${styles.itemNotif} ${
                    notif.leido ? styles.leido : styles.noLeido
                  }`}
                  onClick={() => {
                    if (notif.enlace) handleNavegar(notif.enlace);
                  }}
                  style={notif.enlace ? { cursor: 'pointer' } : {}}
                >
                  <div className={styles.contenido}>
                    <div className={styles.icono}>{notif.icono}</div>
                    <div className={styles.texto}>
                      <div className={styles.titulo}>{notif.titulo}</div>
                      <div className={styles.mensaje}>{notif.mensaje}</div>
                      <div className={styles.fecha}>
                        {new Date(notif.creado).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {!notif.leido && (
                    <button
                      className={styles.btnMarcar}
                      onClick={(e) => handleMarcarComoLeida(e, notif._id)}
                      title="Marcar como leída"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
