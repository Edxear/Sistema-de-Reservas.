import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessGuardiaMedicaArea } from '../../utils/roles';
import AreaBedBoard from '../../components/AreaBedBoard';
import styles from '../enfermeria/Enfermeria.module.css';

const TRIAGE = [
  { nivel: 'Rojo', tiempo: 'Inmediato', criterio: 'Riesgo vital, shock, compromiso de via aerea', accion: 'Ingreso directo a shock room y medico de guardia en sala' },
  { nivel: 'Naranja', tiempo: '< 10 min', criterio: 'Inestabilidad hemodinamica sin colapso', accion: 'Monitoreo continuo y via venosa + laboratorio' },
  { nivel: 'Amarillo', tiempo: '< 30 min', criterio: 'Dolor moderado/severo, fiebre persistente, trauma sin inestabilidad', accion: 'Observacion activa y reevaluacion clinica' },
  { nivel: 'Verde', tiempo: '< 120 min', criterio: 'Cuadro leve sin signos de alarma', accion: 'Consulta medica programada en guardia' },
  { nivel: 'Azul', tiempo: 'No urgente', criterio: 'Consulta administrativa/renovaciones', accion: 'Derivar a consultorio externo' },
];

const CIRCUITOS = [
  { nombre: 'Dolor toracico', pasos: ['ECG en <10 min', 'Troponina basal y seriada', 'Escala de riesgo', 'Interconsulta cardiologia'] },
  { nombre: 'ACV agudo', pasos: ['Codigo ACV', 'TAC urgente', 'NIHSS', 'Ventana terapeutica'] },
  { nombre: 'Sepsis', pasos: ['Lactato', 'Hemocultivos', 'ATB en 1h', 'Fluidos 30 ml/kg si hipotension'] },
  { nombre: 'Politrauma', pasos: ['ATLS primario', 'FAST', 'Control hemorragias', 'Derivacion quirurgica'] },
];

const OBSERVACION = [
  { paciente: 'OBS-201', motivo: 'Dolor abdominal agudo', tiempo: '2h 10m', riesgo: 'medio', siguiente: 'Reevaluacion en 20 min' },
  { paciente: 'OBS-203', motivo: 'Crisis hipertensiva', tiempo: '1h 30m', riesgo: 'alto', siguiente: 'Control TA cada 15 min' },
  { paciente: 'OBS-207', motivo: 'Broncoespasmo', tiempo: '45m', riesgo: 'medio', siguiente: 'Nebulizacion + satO2' },
];

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
        <h1>Area de Guardia Medica</h1>
        <p>Gestion integral de urgencias, triage, shock room, observacion y derivaciones criticas.</p>
        <div className={styles.metaRow}>
          <span>Espera promedio: {metrics.esperaPromedio}</span>
          <span>Pacientes en espera: {metrics.pacientesEnEspera}</span>
          <span>Shock room activos: {metrics.shockRoomActivos}</span>
          <span>Observacion activa: {metrics.observacionActiva}</span>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className={styles.pill} type="button" onClick={() => setActiveTab('panel')}>Panel Diario</button>
          <button className={styles.pill} type="button" onClick={() => setActiveTab('triage')}>Triage</button>
          <button className={styles.pill} type="button" onClick={() => setActiveTab('circuitos')}>Circuitos Criticos</button>
          <button className={styles.pill} type="button" onClick={() => setActiveTab('observacion')}>Observacion</button>
          <button className={styles.pill} type="button" onClick={() => setActiveTab('pizarra')}>Pizarra Camas Area</button>
        </div>
      </section>

      {activeTab === 'panel' && (
        <section className={styles.grid}>
          <article className={styles.ramaCard}>
            <h3>Inicio de turno</h3>
            <p>1. Pase clinico con casos activos y pendientes.</p>
            <p>2. Verificacion de carro de paro y medicacion critica.</p>
            <p>3. Chequeo de disponibilidad de camas de observacion.</p>
            <p>4. Confirmacion de equipos de imagen/lab en guardia.</p>
          </article>
          <article className={styles.ramaCard}>
            <h3>Seguridad del paciente</h3>
            <p>Doble identificacion en procedimientos.</p>
            <p>Alerta temprana de sepsis y eventos neurologicos.</p>
            <p>Registro de reevaluaciones por tiempo objetivo.</p>
          </article>
          <article className={styles.ramaCard}>
            <h3>Coordinacion interservicios</h3>
            <p>Derivaciones con UTI, Imagenes, Laboratorio y Quirofano.</p>
            <p>Comunicacion con enfermeria y equipo prehospitalario.</p>
          </article>
        </section>
      )}

      {activeTab === 'triage' && (
        <section className={styles.card}>
          <h2>Matriz de triage</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nivel</th>
                  <th>Tiempo objetivo</th>
                  <th>Criterio</th>
                  <th>Accion inicial</th>
                </tr>
              </thead>
              <tbody>
                {TRIAGE.map((row) => (
                  <tr key={row.nivel}>
                    <td>{row.nivel}</td>
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
              <article key={item.nombre} className={styles.miniCard}>
                <h3 style={{ marginTop: 0, color: '#154870' }}>{item.nombre}</h3>
                {item.pasos.map((paso) => <p key={paso}>- {paso}</p>)}
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'observacion' && (
        <section className={styles.card}>
          <h2>Pacientes en observacion</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Motivo</th>
                  <th>Tiempo</th>
                  <th>Riesgo</th>
                  <th>Proxima accion</th>
                </tr>
              </thead>
              <tbody>
                {OBSERVACION.map((row) => (
                  <tr key={row.paciente}>
                    <td>{row.paciente}</td>
                    <td>{row.motivo}</td>
                    <td>{row.tiempo}</td>
                    <td>{row.riesgo}</td>
                    <td>{row.siguiente}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'pizarra' && <AreaBedBoard areaKey="guardia-medica" />}
    </div>
  );
}
