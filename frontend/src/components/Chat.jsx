import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function Chat({ otroUsuario, onCerrar }) {
  const { user, token } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!otroUsuario?._id || !token) return;

    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      toast.error(`Error de conexión: ${err.message}`);
    });

    socket.on('historial', (msgs) => {
      setMensajes(msgs);
    });

    socket.on('nuevoMensaje', (msg) => {
      setMensajes((prev) => [...prev, msg]);
    });

    socket.emit('joinRoom', { otroUserId: otroUsuario._id });

    return () => {
      socket.disconnect();
    };
  }, [otroUsuario?._id, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    socketRef.current?.emit('enviarMensaje', {
      paraUserId: otroUsuario._id,
      contenido: texto.trim(),
    });
    setTexto('');
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.ventana}>
        <div style={styles.header}>
          <span>Chat con {otroUsuario?.nombre || 'Usuario'}</span>
          <button onClick={onCerrar} style={styles.cerrarBtn}>✕</button>
        </div>

        <div style={styles.mensajes}>
          {mensajes.map((m, i) => {
            const esMio = (m.de?._id || m.de) === user?._id;
            return (
              <div key={i} style={{ ...styles.burbuja, alignSelf: esMio ? 'flex-end' : 'flex-start', backgroundColor: esMio ? '#0070f3' : '#e5e7eb' }}>
                {!esMio && <small style={styles.nombreRemoto}>{m.de?.nombre}</small>}
                <p style={{ margin: 0, color: esMio ? '#fff' : '#111' }}>{m.contenido}</p>
                <small style={{ color: esMio ? '#cce4ff' : '#6b7280', fontSize: '0.7rem' }}>
                  {new Date(m.createdAt).toLocaleTimeString()}
                </small>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={enviar} style={styles.form}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje..."
            style={styles.input}
          />
          <button type="submit" style={styles.sendBtn}>Enviar</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', bottom: 20, right: 20, zIndex: 1000 },
  ventana: { width: 340, height: 480, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { background: '#0070f3', color: '#fff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 },
  cerrarBtn: { background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' },
  mensajes: { flex: 1, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
  burbuja: { maxWidth: '75%', padding: '8px 12px', borderRadius: 16, wordBreak: 'break-word' },
  nombreRemoto: { display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: 2, color: '#374151' },
  form: { display: 'flex', borderTop: '1px solid #e5e7eb', padding: 8, gap: 6 },
  input: { flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 20, outline: 'none', fontSize: '0.9rem' },
  sendBtn: { padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 600 },
};
