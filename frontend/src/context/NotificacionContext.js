import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import api from '../services/api';

const NotificacionContext = createContext();

export function NotificacionProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Obtener token del localStorage
  const token = localStorage.getItem('token');

  // Inicializar socket.io
  useEffect(() => {
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('[NotificacionContext] Socket conectado');
    });

    newSocket.on('nuevaNotificacion', (notificacion) => {
      console.log('[NotificacionContext] Nueva notificación:', notificacion);
      agregarNotificacion(notificacion);
    });

    newSocket.on('error', (error) => {
      console.error('[NotificacionContext] Error socket:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Obtener notificaciones del servidor
  const fetchNotificaciones = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.get('/api/notificaciones');
      setNotificaciones(response.data.notificaciones);
      setNoLeidas(response.data.noLeidas);
    } catch (error) {
      console.error('Error fetching notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar una notificación como leída
  const marcarComoLeida = async (id) => {
    try {
      await api.put(`/api/notificaciones/${id}`);
      setNotificaciones((prev) =>
        prev.map((n) => (n._id === id ? { ...n, leido: true } : n))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  // Marcar todas como leídas
  const marcarTodoComoLeido = async () => {
    try {
      await api.patch('/api/notificaciones/marcar-todas-leidas');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
      setNoLeidas(0);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  // Agregar notificación (socket listener)
  const agregarNotificacion = (notificacion) => {
    setNotificaciones((prev) => [notificacion, ...prev]);
    if (!notificacion.leido) {
      setNoLeidas((prev) => prev + 1);
    }
  };

  // Obtener notificaciones al montar
  useEffect(() => {
    if (token) {
      fetchNotificaciones();
    }
  }, [token]);

  const value = {
    notificaciones,
    noLeidas,
    loading,
    fetchNotificaciones,
    marcarComoLeida,
    marcarTodoComoLeido,
    agregarNotificacion,
  };

  return (
    <NotificacionContext.Provider value={value}>
      {children}
    </NotificacionContext.Provider>
  );
}

export function useNotificaciones() {
  const context = useContext(NotificacionContext);
  if (!context) {
    throw new Error('useNotificaciones must be used within NotificacionProvider');
  }
  return context;
}
