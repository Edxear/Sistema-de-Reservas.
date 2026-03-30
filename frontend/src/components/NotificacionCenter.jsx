import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificaciones } from '../context/NotificacionContext';
import { useAuth } from '../context/AuthContext';
import styles from './NotificacionCenter.module.css';

export default function NotificacionCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const resolverEnlace = (notif) => {
    const enlace = notif?.enlace || '';
    if (!enlace) return '';

    const esNotificacionDeTurno = String(notif?.tipo || '').startsWith('reserva_');
    const esPaciente = user?.rol === 'paciente';
    const matchBooking = enlace.match(/bookingId=([^&]+)/);
    const bookingId = matchBooking?.[1] || '';

    if (esPaciente && esNotificacionDeTurno && bookingId) {
      return `/perfil?seccion=turnos&bookingId=${bookingId}`;
    }

    return enlace;
  };

  const handleNavegar = (enlace) => {
    if (enlace) {
      navigate(enlace);
      setAbierto(false);
    }
  };

  const handleClickNotif = async (notif) => {
    if (!notif.leido) {
      await marcarComoLeida(notif._id);
    }

    const enlaceDestino = resolverEnlace(notif);
    if (enlaceDestino) {
      handleNavegar(enlaceDestino);
      return;
    }

    setAbierto(false);
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
                  onClick={() => handleClickNotif(notif)}
                  style={{ cursor: 'pointer' }}
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
