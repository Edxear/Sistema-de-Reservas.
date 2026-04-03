import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import organigramaHospitalario from '../../data/organigramaHospitalario.json';
import styles from './Enfermeria.module.css';

const ENFERMERIA_RAMAS = [
  { nombre: 'Guardia', nivel: 'Critico', descripcion: 'Respuesta inmediata, triage y estabilizacion inicial.' },
  { nombre: 'Internacion Adultos', nivel: 'Alto', descripcion: 'Seguimiento continuo, medicacion y evolucion diaria.' },
  { nombre: 'UTI / Cuidados Criticos', nivel: 'Critico', descripcion: 'Monitoreo avanzado y coordinacion con terapia intensiva.' },
  { nombre: 'Quirurgica', nivel: 'Alto', descripcion: 'Preparacion prequirurgica y recuperacion postoperatoria.' },
  { nombre: 'Pediatrica', nivel: 'Alto', descripcion: 'Atencion integral del nino con enfoque familiar.' },
  { nombre: 'Neonatologia', nivel: 'Critico', descripcion: 'Cuidados especializados para recien nacidos.' },
  { nombre: 'Vacunatorio', nivel: 'Medio', descripcion: 'Campanas, calendario y control de inmunizaciones.' },
  { nombre: 'Control de Infecciones', nivel: 'Alto', descripcion: 'Protocolos, vigilancia y prevencion epidemiologica.' },
];

const JERARQUIA = [
  { nivel: 1, cargo: 'Jefatura de Enfermeria', responsabilidad: 'Direccion estrategica y definicion de protocolos.' },
  { nivel: 2, cargo: 'Subjefatura / Coordinacion de Turno', responsabilidad: 'Gestion operativa diaria y cobertura de guardias.' },
  { nivel: 3, cargo: 'Coordinaciones por Rama', responsabilidad: 'Supervision clinica por especialidad y estandares de calidad.' },
  { nivel: 4, cargo: 'Enfermeria Senior', responsabilidad: 'Referente tecnico, tutoria y soporte en casos complejos.' },
  { nivel: 5, cargo: 'Enfermeria Asistencial', responsabilidad: 'Ejecucion de cuidados, registros y continuidad asistencial.' },
];

export default function Enfermeria() {
  const { user } = useAuth();

  const bloqueEnfermeria = useMemo(() => {
    return (organigramaHospitalario?.bloques || []).find((b) => String(b.area || '').toLowerCase() === 'enfermeria');
  }, []);

  const equiposBase = bloqueEnfermeria?.equipos || [];
  const puestosBase = bloqueEnfermeria?.puestos || [];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Area de Enfermeria</h1>
        <p>Espacio exclusivo para Enfermeria con cobertura de todas las ramas y orden jerarquico propio.</p>
        <div className={styles.metaRow}>
          <span>Usuario activo: {user?.nombre || 'Sin sesion'}</span>
          <span>Rol: {user?.rol || '-'}</span>
        </div>
      </section>

      <section className={styles.card}>
        <h2>Ramas de Enfermeria</h2>
        <div className={styles.grid}>
          {ENFERMERIA_RAMAS.map((rama) => (
            <article key={rama.nombre} className={styles.ramaCard}>
              <h3>{rama.nombre}</h3>
              <p>{rama.descripcion}</p>
              <span className={styles.pill}>Prioridad: {rama.nivel}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2>Organigrama Jerarquico de Enfermeria</h2>
        <div className={styles.timeline}>
          {JERARQUIA.map((item) => (
            <div key={item.nivel} className={styles.timelineItem}>
              <div className={styles.timelineLevel}>Nivel {item.nivel}</div>
              <div className={styles.timelineBody}>
                <strong>{item.cargo}</strong>
                <p>{item.responsabilidad}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2>Estructura Base Institucional (Enfermeria)</h2>
        <div className={styles.infoRow}>
          <div>
            <strong>Jefatura:</strong> {bloqueEnfermeria?.jefe || 'No definida'}
          </div>
          <div>
            <strong>Subjefatura:</strong> {bloqueEnfermeria?.subjefe || 'No definida'}
          </div>
        </div>

        <div className={styles.subsection}>
          <h3>Equipos</h3>
          <ul className={styles.list}>
            {equiposBase.length ? equiposBase.map((eq) => <li key={eq}>{eq}</li>) : <li>Sin equipos cargados</li>}
          </ul>
        </div>

        <div className={styles.subsection}>
          <h3>Puestos Clave</h3>
          <div className={styles.gridMini}>
            {puestosBase.length ? puestosBase.map((p) => (
              <div key={p.nombre} className={styles.miniCard}>
                <strong>{p.nombre}</strong>
                <p>{(p.personas || []).join(', ') || 'Sin asignacion'}</p>
              </div>
            )) : <p>Sin puestos cargados.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
