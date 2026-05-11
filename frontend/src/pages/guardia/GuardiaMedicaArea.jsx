import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessGuardiaMedicaArea } from '../../utils/roles';
import AreaBedBoard from '../../components/AreaBedBoard';
import ShiftReport from '../../components/ShiftReport';
import {
  FaHeartbeat,
  FaShieldAlt, FaHandshake, FaSyringe,
  FaBrain, FaBone
} from 'react-icons/fa';
import styles from '../operaciones/OperationalArea.module.css';

const TRIAGE = [
  { nivel: 'Rojo', tiempo: 'Inmediato', criterio: 'Riesgo vital, shock, compromiso de via aerea', accion: 'Ingreso directo a shock room y medico de guardia en sala' },
  { nivel: 'Naranja', tiempo: '< 10 min', criterio: 'Inestabilidad hemodinamica sin colapso', accion: 'Monitoreo continuo y via venosa + laboratorio' },
  { nivel: 'Amarillo', tiempo: '< 30 min', criterio: 'Dolor moderado/severo, fiebre persistente, trauma sin inestabilidad', accion: 'Observacion activa y reevaluacion clinica' },
  { nivel: 'Verde', tiempo: '< 120 min', criterio: 'Cuadro leve sin signos de alarma', accion: 'Consulta medica programada en guardia' },
  { nivel: 'Azul', tiempo: 'No urgente', criterio: 'Consulta administrativa/renovaciones', accion: 'Derivar a consultorio externo' },
];

const CIRCUITOS = [
  { nombre: 'Dolor toracico', icon: React.createElement(FaHeartbeat), pasos: ['ECG en <10 min', 'Troponina basal y seriada', 'Escala de riesgo', 'Interconsulta cardiologia'] },
  { nombre: 'ACV agudo', icon: React.createElement(FaBrain), pasos: ['Codigo ACV', 'TAC urgente', 'NIHSS', 'Ventana terapeutica'] },
  { nombre: 'Sepsis', icon: React.createElement(FaSyringe), pasos: ['Lactato', 'Hemocultivos', 'ATB en 1h', 'Fluidos 30 ml/kg si hipotension'] },
  { nombre: 'Politrauma', icon: React.createElement(FaBone), pasos: ['ATLS primario', 'FAST', 'Control hemorragias', 'Derivacion quirurgica'] },
];

const OBSERVACION = [
  { paciente: 'OBS-201', motivo: 'Dolor abdominal agudo', tiempo: '2h 10m', riesgo: 'medio', siguiente: 'Reevaluacion en 20 min' },
  { paciente: 'OBS-203', motivo: 'Crisis hipertensiva', tiempo: '1h 30m', riesgo: 'alto', siguiente: 'Control TA cada 15 min' },
  { paciente: 'OBS-207', motivo: 'Broncoespasmo', tiempo: '45m', riesgo: 'medio', siguiente: 'Nebulizacion + satO2' },
];

const RISK_COLORS = {
  alto: { background: '#fdeaea', color: '#9f2424', border: '1px solid #ef9c9c' },
  medio: { background: '#fff8e2', color: '#8a6405', border: '1px solid #f1cf76' },
  bajo: { background: '#e8f8ee', color: '#1f7a3e', border: '1px solid #89d9a8' },
};

export default function GuardiaMedicaArea() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('panel');

  const canAccess = canAccessGuardiaMedicaArea(user);

  const metrics = useMemo(() => ({
    esperaPromedio: '28 min',
    pacientesEnEspera: 14,
    shockRoomActivos: 2,
    observacionActiva: OBSERVACION.length,
  }), []);

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Área de Guardia Médica</h1>
        <p>Gestión integral de urgencias, triage, shock room, observación y derivaciones críticas.</p>
        <div className={styles.metaRow}>
          <span className={styles.metaTag}>Espera prom: {metrics.esperaPromedio}</span>
          <span className={styles.metaTag}>Pacientes en espera: {metrics.pacientesEnEspera}</span>
          <span className={styles.metaTag}>Shock room activos: {metrics.shockRoomActivos}</span>
          <span className={styles.metaTag}>Observación activa: {metrics.observacionActiva}</span>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'panel', label: '🏥 Panel Diario', color: '#ef4444' },
            { key: 'triage', label: '🚨 Triage', color: '#f97316' },
            { key: 'circuitos', label: '⚡ Circuitos Críticos', color: '#8b5cf6' },
            { key: 'observacion', label: '👁️ Observación', color: '#0284c7' },
            { key: 'pizarra', label: '🛏️ Pizarra Camas', color: '#0f766e' },
            { key: 'pase', label: '🔁 Pase de Guardia', color: '#10b981' },
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
            <h3>Inicio de turno</h3>
            <ul>
              <li>Pase clinico con casos activos y pendientes.</li>
              <li>Verificacion de carro de paro y medicacion critica.</li>
              <li>Chequeo de disponibilidad de camas de observacion.</li>
              <li>Confirmacion de equipos de imagen/lab en guardia.</li>
            </ul>
          </article>
          <article className={styles.panelCard}>
            <h3><FaShieldAlt /> Seguridad del paciente</h3>
            <ul>
              <li>Doble identificacion en procedimientos.</li>
              <li>Alerta temprana de sepsis y eventos neurologicos.</li>
              <li>Registro de reevaluaciones por tiempo objetivo.</li>
            </ul>
          </article>
          <article className={styles.panelCard}>
            <h3><FaHandshake /> Coordinacion interservicios</h3>
            <ul>
              <li>Derivaciones con UTI, Imagenes, Laboratorio y Quirofano.</li>
              <li>Comunicacion con enfermeria y equipo prehospitalario.</li>
            </ul>
          </article>
        </section>
      )}

      {activeTab === 'triage' && (
        <section className={styles.card}>
          <h2>Matriz de triage</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Nivel</th><th>Tiempo objetivo</th><th>Criterio</th><th>Acción inicial</th></tr>
              </thead>
              <tbody>
                {TRIAGE.map((row) => (
                  <tr key={row.nivel}>
                    <td><strong>{row.nivel}</strong></td>
                    <td>{row.tiempo}</td>
                    <td>{row.criterio}</td>
                    <td>{row.accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'circuitos' && (
        <section className={styles.card}>
          <h2>Circuitos asistenciales de alta prioridad</h2>
          <div className={styles.grid2}>
            {CIRCUITOS.map((item) => (
              <article key={item.nombre} className={styles.panelCard}>
                <h3>{item.icon} {item.nombre}</h3>
                <ul>
                  {item.pasos.map((paso) => <li key={paso}>- {paso}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'observacion' && (
        <section className={styles.card}>
          <h2>Pacientes en observación</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Paciente</th><th>Motivo</th><th>Tiempo</th><th>Riesgo</th><th>Próxima acción</th></tr>
              </thead>
              <tbody>
                {OBSERVACION.map((row) => (
                  <tr key={row.paciente}>
                    <td>{row.paciente}</td>
                    <td>{row.motivo}</td>
                    <td>{row.tiempo}</td>
                    <td>
                      <span style={{
                        ...(RISK_COLORS[row.riesgo] || RISK_COLORS.bajo),
                        padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                      }}>
                        {row.riesgo}
                      </span>
                    </td>
                    <td>{row.siguiente}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'pizarra' && <AreaBedBoard areaKey="guardia-medica" />}
      {activeTab === 'pase' && (
        <section className={styles.card}>
          <h2>Pase de Guardia</h2>
          <ShiftReport area="guardia" areaLabel="Guardia Médica" />
        </section>
      )}
    </div>
  );
}
