import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessMantenimientoArea } from '../../utils/roles';
import ShiftReport from '../../components/ShiftReport';
import styles from '../operaciones/OperationalArea.module.css';

const TAREAS_PREVENTIVAS = [
  { sistema: 'Oxigeno central', frecuencia: 'Diaria', estado: 'ok', responsable: 'Infraestructura Turno A' },
  { sistema: 'Grupo electrogeno', frecuencia: 'Semanal', estado: 'pendiente', responsable: 'Ingenieria Clinica' },
  { sistema: 'Gases medicinales', frecuencia: 'Diaria', estado: 'ok', responsable: 'Mantenimiento Guardia' },
  { sistema: 'Aire acondicionado UTI', frecuencia: 'Diaria', estado: 'alerta', responsable: 'HVAC' },
  { sistema: 'Bombas de infusion (calibracion)', frecuencia: 'Mensual', estado: 'ok', responsable: 'Biomedica' },
];

const INCIDENTES = [
  { id: 'MT-301', area: 'Guardia', impacto: 'alto', detalle: 'Falla parcial de tablero electrico secundario', accion: 'Bypass temporal + recambio programado' },
  { id: 'MT-302', area: 'Internacion', impacto: 'medio', detalle: 'Aire insuficiente en sala 2', accion: 'Cambio de filtros y revision de conductos' },
  { id: 'MT-303', area: 'Quirofano', impacto: 'alto', detalle: 'Alarma de UPS quirurgica', accion: 'Testing baterias y swap preventivo' },
];

const EQUIPOS_BIOMEDICOS = [
  { equipo: 'Monitor multiparametrico', total: 22, operativos: 20, fueraServicio: 2 },
  { equipo: 'Respirador', total: 14, operativos: 13, fueraServicio: 1 },
  { equipo: 'Bomba de infusion', total: 40, operativos: 37, fueraServicio: 3 },
  { equipo: 'Desfibrilador', total: 8, operativos: 8, fueraServicio: 0 },
];

export default function MantenimientoArea() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('panel');
  const canAccess = canAccessMantenimientoArea(user);

  const metrics = useMemo(() => {
    const alertas = TAREAS_PREVENTIVAS.filter((t) => t.estado !== 'ok').length;
    const incidentesCriticos = INCIDENTES.filter((i) => i.impacto === 'alto').length;
    return {
      tareasHoy: TAREAS_PREVENTIVAS.length,
      alertas,
      incidentesActivos: INCIDENTES.length,
      incidentesCriticos,
    };
  }, []);

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Area de Mantenimiento Hospitalario</h1>
        <p>Continuidad operativa de infraestructura critica, ingenieria clinica y soporte edilicio.</p>
        <div className={styles.metaRow}>
          <span className={styles.metaTag}>Tareas hoy: {metrics.tareasHoy}</span>
          <span className={styles.metaTag}>Alertas preventivas: {metrics.alertas}</span>
          <span className={styles.metaTag}>Incidentes activos: {metrics.incidentesActivos}</span>
          <span className={styles.metaTag}>Criticos: {metrics.incidentesCriticos}</span>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'panel', label: '🔧 Panel', color: '#f97316' },
            { key: 'preventivo', label: '📅 Preventivo', color: '#3b82f6' },
            { key: 'incidentes', label: '⚠️ Incidentes', color: '#ef4444' },
            { key: 'biomedica', label: '⚙️ Ingeniería Clínica', color: '#059669' },
            { key: 'pase', label: '🔁 Pase de Turno', color: '#0f766e' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === tab.key ? tab.color : '#e5e7eb',
                color: activeTab === tab.key ? '#fff' : '#1f2937',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.metaRow} style={{ marginTop: '0.5rem' }}>
          <span>Usuario activo: {user?.nombre || 'Sin sesión'}</span>
          <span>Rol: {user?.rol || '-'}</span>
        </div>
      </section>

      {activeTab === 'panel' && (
        <section className={styles.grid3}>
          <article className={styles.panelCard}>
            <h3>Objetivo del turno</h3>
            <p>Mantener operativa la infraestructura critica sin afectar asistencia.</p>
            <p>Prioridad: oxigeno, energia, gases, climatizacion y esterilizacion.</p>
          </article>
          <article className={styles.panelCard}>
            <h3>Protocolo de incidente critico</h3>
            <p>1. Contencion inmediata de riesgo.</p>
            <p>2. Aviso a Jefatura y Operaciones.</p>
            <p>3. Plan de contingencia y SLA de recuperacion.</p>
          </article>
          <article className={styles.panelCard}>
            <h3>Impacto clinico</h3>
            <p>Cada evento se clasifica por riesgo en areas asistenciales.</p>
            <p>Se prioriza guardia, UTI, quirofano y neonatologia.</p>
          </article>
        </section>
      )}

      {activeTab === 'preventivo' && (
        <section className={styles.card}>
          <h2>Checklist preventivo</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sistema</th>
                  <th>Frecuencia</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {TAREAS_PREVENTIVAS.map((row) => (
                  <tr key={row.sistema}>
                    <td>{row.sistema}</td>
                    <td>{row.frecuencia}</td>
                    <td>{row.estado}</td>
                    <td>{row.responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'incidentes' && (
        <section className={styles.card}>
          <h2>Incidentes operativos activos</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Area afectada</th>
                  <th>Impacto</th>
                  <th>Detalle</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {INCIDENTES.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.area}</td>
                    <td>{row.impacto}</td>
                    <td>{row.detalle}</td>
                    <td>{row.accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'biomedica' && (
        <section className={styles.card}>
          <h2>Disponibilidad de equipos biomedicos</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Total</th>
                  <th>Operativos</th>
                  <th>Fuera de servicio</th>
                </tr>
              </thead>
              <tbody>
                {EQUIPOS_BIOMEDICOS.map((row) => (
                  <tr key={row.equipo}>
                    <td>{row.equipo}</td>
                    <td>{row.total}</td>
                    <td>{row.operativos}</td>
                    <td>{row.fueraServicio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'pase' && (
        <section className={styles.card}>
          <h2>Pase de Turno</h2>
          <ShiftReport area="mantenimiento" areaLabel="Mantenimiento Hospitalario" />
        </section>
      )}
    </div>
  );
}
