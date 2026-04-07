import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { createAyudaRapida } from '../../services/enfermeriaService';
import styles from './Enfermeria.module.css';

const DESTINOS = [
  {
    key: 'supervisor',
    icono: '👔',
    titulo: 'Supervisor de Turno',
    descripcion: 'Jefatura, coordinación y subjefatura de enfermería',
  },
  {
    key: 'medico',
    icono: '🩺',
    titulo: 'Médico de Guardia',
    descripcion: 'Médicos disponibles del sistema',
  },
  {
    key: 'equipo',
    icono: '⚡',
    titulo: 'Equipo de Respuesta Rápida',
    descripcion: 'Médicos + coordinadores + administración',
  },
];

export default function AyudaRapida({ branches, userRama }) {
  const [abierto, setAbierto] = useState(false);
  const [destino, setDestino] = useState('supervisor');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);

  const rama = userRama || (branches?.[0] || '');

  const handleEnviar = async () => {
    if (!destino) return;
    setEnviando(true);
    setConfirmacion(null);
    try {
      const res = await createAyudaRapida({ destino, rama, mensaje: mensaje.trim() });
      setConfirmacion(res);
      setMensaje('');
      toast.success(
        res.receptores > 0
          ? `Solicitud enviada a ${res.receptores} receptor${res.receptores !== 1 ? 'es' : ''}`
          : 'Solicitud enviada (sin receptores disponibles en este momento)',
        { autoClose: 5000 },
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar la solicitud de ayuda');
    } finally {
      setEnviando(false);
    }
  };

  const handleCerrar = () => {
    setAbierto(false);
    setMensaje('');
    setConfirmacion(null);
    setDestino('supervisor');
  };

  return (
    <section
      className={styles.card}
      style={{
        borderLeft: '4px solid #ef4444',
        backgroundColor: '#fff5f5',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, color: '#dc2626' }}>🚨 Asistencia Urgente</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
            Notifica instantáneamente a tu equipo ante una situación urgente.
          </p>
        </div>
        {!abierto && (
          <button
            type="button"
            className={styles.pill}
            onClick={() => { setAbierto(true); setConfirmacion(null); }}
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              fontWeight: '700',
              fontSize: '1rem',
              padding: '10px 22px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239,68,68,0.35)',
            }}
          >
            🚨 Pedir Ayuda
          </button>
        )}
      </div>

      {/* FORMULARIO */}
      {abierto && (
        <div style={{ marginTop: '1.25rem' }}>
          {/* SELECCIÓN DE DESTINO */}
          <p style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>¿A quién alertar?</p>
          <div className={styles.gridMini} style={{ marginBottom: '1rem' }}>
            {DESTINOS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setDestino(d.key)}
                style={{
                  border: `2px solid ${destino === d.key ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  backgroundColor: destino === d.key ? '#fee2e2' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '1rem', color: destino === d.key ? '#dc2626' : '#1f2937' }}>
                  {d.icono} {d.titulo}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '3px' }}>{d.descripcion}</div>
              </button>
            ))}
          </div>

          {/* RAMA */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
              Rama / Sector
            </label>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
              📍 {rama || 'No especificada'}
            </p>
          </div>

          {/* MENSAJE OPCIONAL */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
              Mensaje adicional (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ej: Paciente con deterioro hemodinámico, necesito médico de guardia urgente..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value.slice(0, 500))}
              maxLength={500}
              disabled={enviando}
              style={{
                width: '100%',
                resize: 'vertical',
                boxSizing: 'border-box',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                color: '#374151',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right' }}>{mensaje.length}/500</p>
          </div>

          {/* CONFIRMACIÓN PREVIA */}
          {confirmacion && (
            <div
              style={{
                backgroundColor: '#d1fae5',
                borderLeft: '4px solid #10b981',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '1rem',
              }}
            >
              <strong style={{ color: '#065f46' }}>✅ Solicitud enviada</strong>
              <p style={{ margin: '4px 0 0', color: '#065f46', fontSize: '0.9rem' }}>
                Se notificó a <strong>{confirmacion.receptores}</strong> persona{confirmacion.receptores !== 1 ? 's' : ''} del equipo
                ({confirmacion.destino}: {confirmacion.rama || 'general'}).
              </p>
            </div>
          )}

          {/* ACCIONES */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={styles.pill}
              onClick={handleEnviar}
              disabled={enviando || !destino}
              style={{
                backgroundColor: enviando ? '#9ca3af' : '#ef4444',
                color: '#fff',
                fontWeight: '700',
                border: 'none',
                cursor: enviando ? 'not-allowed' : 'pointer',
              }}
            >
              {enviando ? 'Enviando...' : '🚨 Enviar alerta'}
            </button>
            <button
              type="button"
              className={styles.pill}
              onClick={handleCerrar}
              disabled={enviando}
              style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
