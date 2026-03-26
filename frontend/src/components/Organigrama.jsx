import React from 'react';
import styles from './Organigrama.module.css';

const estructura = [
  {
    area: 'Dirección General',
    jefe: 'Director Médico',
    subjefe: 'Subdirector Asistencial',
    equipos: ['Secretaría de Dirección', 'Calidad y Seguridad del Paciente']
  },
  {
    area: 'Cuerpo Médico',
    jefe: 'Jefe de Cuerpo Médico',
    subjefe: 'Subjefe de Especialidades',
    equipos: ['Clínica Médica', 'Pediatría', 'Traumatología', 'Neurología', 'Dermatología']
  },
  {
    area: 'Enfermería',
    jefe: 'Jefe de Enfermería',
    subjefe: 'Subjefe de Turno',
    equipos: ['Enfermería de Guardia', 'Enfermería de Internación', 'Vacunatorio']
  },
  {
    area: 'Diagnóstico y Apoyo',
    jefe: 'Jefe de Diagnóstico',
    subjefe: 'Subjefe de Laboratorio',
    equipos: ['Laboratorio', 'Imágenes', 'Farmacia Hospitalaria']
  },
  {
    area: 'Administración y Atención',
    jefe: 'Jefe Administrativo',
    subjefe: 'Subjefe de Admisión',
    equipos: ['Admisión', 'Facturación', 'Obras Sociales', 'Atención al Paciente']
  },
  {
    area: 'Servicios Generales',
    jefe: 'Jefe de Servicios Generales',
    subjefe: 'Subjefe Operativo',
    equipos: ['Limpieza', 'Mantenimiento', 'Seguridad', 'Logística']
  }
];

export default function Organigrama() {
  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1>Organigrama Institucional</h1>
        <p>Ejemplo de estructura organizacional para un hospital o clínica.</p>
      </section>

      <section className={styles.grid}>
        {estructura.map((bloque) => (
          <article key={bloque.area} className={styles.card}>
            <h2>{bloque.area}</h2>
            <p><strong>Jefe:</strong> {bloque.jefe}</p>
            <p><strong>Subjefe:</strong> {bloque.subjefe}</p>
            <div>
              <strong>Áreas / Equipos:</strong>
              <ul>
                {bloque.equipos.map((equipo) => (
                  <li key={equipo}>{equipo}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
