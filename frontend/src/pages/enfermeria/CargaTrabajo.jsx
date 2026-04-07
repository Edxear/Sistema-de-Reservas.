import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getNursingWorkload } from '../../services/enfermeriaService';
import styles from './Enfermeria.module.css';

const InfoBtn = ({ texto }) => (
  <button
    type="button"
    onClick={() => alert(texto)}
    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', opacity: 0.7 }}
    title="Mas informacion"
  >
    ℹ️
  </button>
);

const CARGA_COLOR = {
  green: { bg: '#d1fae5', borde: '#10b981', texto: '#065f46', label: 'Carga normal' },
  yellow: { bg: '#fef9c3', borde: '#f59e0b', texto: '#92400e', label: 'Carga elevada' },
  red: { bg: '#fee2e2', borde: '#ef4444', texto: '#7f1d1d', label: 'Sobrecarga' },
};

export default function CargaTrabajo() {
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ramaFiltro, setRamaFiltro] = useState('');
  const [expandida, setExpandida] = useState({});
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await getNursingWorkload();
      setWorkload(Array.isArray(data?.workload) ? data.workload : []);
      setUltimaActualizacion(new Date());
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar la carga de trabajo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const toggleExpandir = (rama) => {
    setExpandida((prev) => ({ ...prev, [rama]: !prev[rama] }));
  };

  const visible = ramaFiltro ? workload.filter((w) => w.rama === ramaFiltro) : workload;

  const totales = workload.reduce(
    (acc, w) => ({
      staff: acc.staff + (w.staff || 0),
      dotacionPresente: acc.dotacionPresente + (w.dotacionPresente || 0),
      pacientes: acc.pacientes + (w.pacientes || 0),
      incidentesAbiertos: acc.incidentesAbiertos + (w.incidentesAbiertos || 0),
    }),
    { staff: 0, dotacionPresente: 0, pacientes: 0, incidentesAbiertos: 0 },
  );

  const nivelGlobalCarga = workload.some((w) => w.estadoCarga === 'red')
    ? 'red'
    : workload.some((w) => w.estadoCarga === 'yellow')
    ? 'yellow'
    : 'green';

  const ramasDisponibles = [...new Set(workload.map((w) => w.rama).filter(Boolean))];

  return (
    <div>
      {/* HEADER */}
      <section className={styles.card} style={{ borderLeft: '4px solid #6366f1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>📊 Dashboard de Carga de Trabajo</h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Vista de supervisor: distribución de pacientes y personal por rama en las últimas 24 horas.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className={styles.pill}
              onClick={cargar}
              disabled={loading}
              style={{ backgroundColor: '#6366f1', color: '#fff' }}
            >
              {loading ? 'Actualizando...' : '🔄 Actualizar'}
            </button>
            <InfoBtn texto={'Dashboard de Carga de Trabajo:\n\nMuestra la distribución actual de pacientes y personal por rama.\n\n• Verde: carga normal (≤5 pac/enfermera)\n• Amarillo: carga elevada (5-8 pac/enfermera)\n• Rojo: sobrecarga (>8 pac/enfermera)\n\nLos datos se basan en los checklists de las últimas 24 horas.\nHaz clic en cada tarjeta para ver el personal de la rama.'} />
          </div>
        </div>

        {/* RESUMEN GLOBAL */}
        <div className={styles.gridMini} style={{ marginTop: '1rem' }}>
          <div className={styles.miniCard}>
            <strong>Personal registrado</strong>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{totales.staff}</p>
          </div>
          <div className={styles.miniCard}>
            <strong>Personal presente (24h)</strong>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{totales.dotacionPresente}</p>
          </div>
          <div className={styles.miniCard}>
            <strong>Pacientes atendidos (24h)</strong>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{totales.pacientes}</p>
          </div>
          <div
            className={styles.miniCard}
            style={{ backgroundColor: CARGA_COLOR[nivelGlobalCarga].bg, borderLeft: `4px solid ${CARGA_COLOR[nivelGlobalCarga].borde}` }}
          >
            <strong>Estado global de carga</strong>
            <p style={{ fontSize: '1.1rem', fontWeight: '700', color: CARGA_COLOR[nivelGlobalCarga].texto }}>
              {nivelGlobalCarga === 'red' ? '🔴' : nivelGlobalCarga === 'yellow' ? '🟡' : '🟢'}{' '}
              {CARGA_COLOR[nivelGlobalCarga].label}
            </p>
          </div>
          {totales.incidentesAbiertos > 0 && (
            <div className={styles.miniCard} style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444' }}>
              <strong>Incidentes abiertos</strong>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7f1d1d' }}>{totales.incidentesAbiertos}</p>
            </div>
          )}
        </div>

        {ultimaActualizacion && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            Última actualización: {ultimaActualizacion.toLocaleTimeString()}
          </p>
        )}
      </section>

      {/* FILTRO POR RAMA */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <div className={styles.actionsRow}>
          <h3>Por rama</h3>
          <select
            className={styles.select}
            value={ramaFiltro}
            onChange={(e) => setRamaFiltro(e.target.value)}
            style={{ maxWidth: '280px' }}
          >
            <option value="">Todas las ramas</option>
            {ramasDisponibles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {loading && <p style={{ color: '#9ca3af', padding: '1rem 0' }}>Cargando datos...</p>}

        {!loading && visible.length === 0 && (
          <p style={{ color: '#9ca3af', padding: '1rem 0' }}>
            No hay datos de carga disponibles. Regístrate en un checklist de turno para ver esta información.
          </p>
        )}

        <div className={styles.grid} style={{ marginTop: '1rem' }}>
          {visible.map((w) => {
            const estado = CARGA_COLOR[w.estadoCarga] || CARGA_COLOR.green;
            const isOpen = expandida[w.rama];
            return (
              <article
                key={w.rama}
                className={styles.ramaCard}
                style={{ borderLeft: `4px solid ${estado.borde}`, backgroundColor: estado.bg + '44' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{w.rama}</h3>
                  <span
                    className={styles.pill}
                    style={{ backgroundColor: estado.bg, color: estado.texto, border: `1px solid ${estado.borde}`, cursor: 'default' }}
                  >
                    {w.estadoCarga === 'red' ? '🔴' : w.estadoCarga === 'yellow' ? '🟡' : '🟢'} {estado.label}
                  </span>
                </div>

                <div className={styles.gridMini} style={{ marginTop: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Personal registrado</span>
                    <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: '2px 0' }}>{w.staff}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Presentes (24h)</span>
                    <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: '2px 0' }}>
                      {w.dotacionPresente}
                      {w.dotacionPlanificada > 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '400' }}>
                          {' '}/ {w.dotacionPlanificada} plan.
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Pacientes (24h)</span>
                    <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: '2px 0' }}>{w.pacientes}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Pac/enfermera</span>
                    <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: '2px 0', color: estado.texto }}>
                      {w.pacientesPorEnfermera}
                    </p>
                  </div>
                  {w.incidentesAbiertos > 0 && (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Incidentes abiertos</span>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: '2px 0', color: '#dc2626' }}>
                        {w.incidentesAbiertos}
                      </p>
                    </div>
                  )}
                  {w.alertasCriticas > 0 && (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Alertas críticas</span>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: '2px 0', color: '#ea580c' }}>
                        {w.alertasCriticas}
                      </p>
                    </div>
                  )}
                  {w.cumplimientoProtocolos !== null && w.cumplimientoProtocolos !== undefined && (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Cumplimiento</span>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: '2px 0', color: w.cumplimientoProtocolos >= 90 ? '#065f46' : w.cumplimientoProtocolos >= 75 ? '#92400e' : '#7f1d1d' }}>
                        {w.cumplimientoProtocolos}%
                      </p>
                    </div>
                  )}
                </div>

                {w.personal?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpandir(w.rama)}
                    style={{
                      marginTop: '0.75rem',
                      background: 'none',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: '#374151',
                    }}
                  >
                    {isOpen ? '▲ Ocultar personal' : `▼ Ver personal (${w.personal.length})`}
                  </button>
                )}

                {isOpen && w.personal?.length > 0 && (
                  <ul className={styles.list} style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {w.personal.map((p) => (
                      <li key={p._id} style={{ padding: '4px 0' }}>
                        <strong>{p.nombre}</strong>
                        {p.cargo && p.cargo !== 'Enfermero/a' && (
                          <span style={{ color: '#6b7280', marginLeft: '0.4rem', fontSize: '0.8rem' }}>({p.cargo})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* LEYENDA */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <h3>Referencia de carga</h3>
        <div className={styles.gridMini}>
          {Object.entries(CARGA_COLOR).map(([nivel, cfg]) => (
            <div key={nivel} className={styles.miniCard} style={{ backgroundColor: cfg.bg, borderLeft: `4px solid ${cfg.borde}` }}>
              <strong style={{ color: cfg.texto }}>{nivel === 'green' ? '🟢' : nivel === 'yellow' ? '🟡' : '🔴'} {cfg.label}</strong>
              <p style={{ fontSize: '0.85rem', color: cfg.texto, marginTop: '0.25rem' }}>
                {nivel === 'green' ? '≤ 5 pacientes por enfermera'
                  : nivel === 'yellow' ? '5 – 8 pacientes por enfermera'
                  : '> 8 pacientes por enfermera'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
