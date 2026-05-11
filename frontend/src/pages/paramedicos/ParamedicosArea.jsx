import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessParamedicosArea } from '../../utils/roles';
import ShiftReport from '../../components/ShiftReport';
import styles from '../operaciones/OperationalArea.module.css';

const SALIDAS = [
  { codigo: 'AMB-501', tipo: 'Trauma vial', prioridad: 'alta', unidad: 'Movil 1', estado: 'en curso', eta: '12 min' },
  { codigo: 'AMB-502', tipo: 'Dolor toracico', prioridad: 'alta', unidad: 'UTIM 2', estado: 'en curso', eta: '8 min' },
  { codigo: 'AMB-503', tipo: 'Traslado interhospitalario', prioridad: 'media', unidad: 'Movil 3', estado: 'programado', eta: '30 min' },
];

const FLOTA = [
  { unidad: 'Movil 1', tipo: 'Soporte Basico', estado: 'operativa', combustible: '78%', desfibrilador: 'ok' },
  { unidad: 'UTIM 2', tipo: 'Soporte Avanzado', estado: 'operativa', combustible: '54%', desfibrilador: 'ok' },
  { unidad: 'Movil 3', tipo: 'Traslados', estado: 'operativa', combustible: '66%', desfibrilador: 'ok' },
  { unidad: 'Movil 4', tipo: 'Soporte Basico', estado: 'mantenimiento', combustible: '25%', desfibrilador: 'revision' },
];

const CHECKLIST_PREHOSP = [
  'Seguridad de escena',
  'Triage inicial y mecanismo de lesion',
  'ABCDE completo',
  'Control de hemorragias',
  'Monitorizacion (TA, FC, SatO2, Glasgow)',
  'Analgesia y estabilizacion',
  'Preaviso al centro receptor',
  'Entrega estructurada en admision/guardia',
];

export default function ParamedicosArea() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('panel');
  const canAccess = canAccessParamedicosArea(user);

  const metrics = useMemo(() => ({
    salidasActivas: SALIDAS.filter((s) => s.estado === 'en curso').length,
    flotaOperativa: FLOTA.filter((u) => u.estado === 'operativa').length,
    prioridadAlta: SALIDAS.filter((s) => s.prioridad === 'alta').length,
  }), []);

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Área de Ambulancia</h1>
        <p>Operación prehospitalaria, estabilización inicial, traslados y coordinación con Guardia.</p>
        <div className={styles.metaRow}>
          <span className={styles.metaTag}>Salidas activas: {metrics.salidasActivas}</span>
          <span className={styles.metaTag}>Flota operativa: {metrics.flotaOperativa}</span>
          <span className={styles.metaTag}>Eventos alta prioridad: {metrics.prioridadAlta}</span>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'panel', label: '🚑 Panel', color: '#0891b2' },
            { key: 'salidas', label: '📍 Salidas', color: '#ef4444' },
            { key: 'flota', label: '🚗 Flota', color: '#3b82f6' },
            { key: 'checklist', label: '✅ Checklist', color: '#10b981' },
            { key: 'pase', label: '🔁 Pase de Turno', color: '#f97316' },
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
            <h3>Flujo operativo diario</h3>
            <p>1. Briefing de turnos y disponibilidad de moviles.</p>
            <p>2. Reposicion de insumos criticos y chequeo DEA.</p>
            <p>3. Coordinacion con Guardia Medica para recepcion.</p>
          </article>
          <article className={styles.panelCard}>
            <h3>Calidad asistencial</h3>
            <p>Tiempos de respuesta, calidad de entrega y seguridad de traslado.</p>
            <p>Registro estandarizado prehospitalario para continuidad clinica.</p>
          </article>
          <article className={styles.panelCard}>
            <h3>Interoperabilidad</h3>
            <p>Preaviso al hospital receptor con resumen clinico y estado del paciente.</p>
            <p>Trazabilidad completa desde escena hasta admision.</p>
          </article>
        </section>
      )}

      {activeTab === 'salidas' && (
        <section className={styles.card}>
          <h2>Salidas en curso y programadas</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Evento</th>
                  <th>Prioridad</th>
                  <th>Unidad</th>
                  <th>Estado</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {SALIDAS.map((row) => (
                  <tr key={row.codigo}>
                    <td>{row.codigo}</td>
                    <td>{row.tipo}</td>
                    <td>{row.prioridad}</td>
                    <td>{row.unidad}</td>
                    <td>{row.estado}</td>
                    <td>{row.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'flota' && (
        <section className={styles.card}>
          <h2>Estado de flota y equipamiento</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Combustible</th>
                  <th>DEA / Monitor</th>
                </tr>
              </thead>
              <tbody>
                {FLOTA.map((row) => (
                  <tr key={row.unidad}>
                    <td>{row.unidad}</td>
                    <td>{row.tipo}</td>
                    <td>{row.estado}</td>
                    <td>{row.combustible}</td>
                    <td>{row.desfibrilador}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'checklist' && (
        <section className={styles.card}>
          <h2>Checklist prehospitalario</h2>
          <div className={styles.listWrap}>
            {CHECKLIST_PREHOSP.map((item) => (
              <div key={item} className={styles.item}>
                <div className={styles.itemTitle}>{item}</div>
                <div className={styles.itemMeta}>Estandar de seguridad y continuidad asistencial</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'pase' && (
        <section className={styles.card}>
          <h2>Pase de Turno</h2>
          <ShiftReport area="paramedicos" areaLabel="Paramedicos y Ambulancia" />
        </section>
      )}
    </div>
  );
}
