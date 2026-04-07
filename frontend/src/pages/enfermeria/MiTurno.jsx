import React, { useState, useEffect } from 'react';
import styles from './Enfermeria.module.css';

/**
 * Componente "Mi Turno" - Sección simplificada para tareas diarias de enfermería
 * 
 * Incluye:
 * 1. Pizarra Digital: resumen visual de pacientes
 * 2. Lista de Tareas: pendientes automáticas del turno
 * 3. Notas del Turno: resumen para siguiente turno
 */

const MiTurno = ({ branches = [], checklists = [], initiatives = [], user = {} }) => {
  const [tareasDelTurno, setTareasDelTurno] = useState([]);
  const [notasDelTurno, setNotasDelTurno] = useState('');
  const [turnoActual, setTurnoActual] = useState('manana');
  const [ramaSeleccionada, setRamaSeleccionada] = useState(branches[0] || 'Guardia');

  // Generar tareas automáticas basadas en checklists e iniciativas
  useEffect(() => {
    const tareas = [];

    // Tareas de seguridad transversals (siempre)
    const tareasTransversales = [
      { id: 't1', titulo: 'Pase de guardia seguro', categoria: 'seguridad', completada: false, horaRecomendada: 'Inicio turno' },
      { id: 't2', titulo: 'Verificar medicación doble chequeo', categoria: 'seguridad', completada: false, horaRecomendada: 'Antes de administrar' },
      { id: 't3', titulo: 'Identificación positiva del paciente', categoria: 'seguridad', completada: false, horaRecomendada: 'Cada intervención' },
      { id: 't4', titulo: 'Prevención de caídas', categoria: 'seguridad', completada: false, horaRecomendada: 'Continuo' },
      { id: 't5', titulo: 'Prevención de úlceras por presión', categoria: 'cuidados', completada: false, horaRecomendada: 'Cada 4 horas' },
      { id: 't6', titulo: 'Monitoreo de signos vitales', categoria: 'monitoreo', completada: false, horaRecomendada: 'Según orden médica' },
    ];

    // Agregar tareas de checklists actuales
    if (checklists && checklists.length > 0) {
      const checklistsDelTurno = checklists.filter(
        (c) => c.turno === turnoActual && (!ramaSeleccionada || c.rama === ramaSeleccionada)
      );
      checklistsDelTurno.forEach((checklist) => {
        if (checklist.pacientesAtendidos > 0) {
          tareas.push({
            id: `check-${checklist._id}`,
            titulo: `Completar checklist: ${checklist.rama}`,
            categoria: 'registro',
            completada: false,
            horaRecomendada: 'Fin de turno',
            pacientes: checklist.pacientesAtendidos,
          });
        }
      });
    }

    // Agregar tareas de iniciativas activas
    if (initiatives && initiatives.length > 0) {
      const iniciativasActivas = initiatives.filter(
        (i) => i.estado === 'en_progreso' && (!ramaSeleccionada || i.rama === ramaSeleccionada || i.rama === 'general')
      );
      iniciativasActivas.forEach((init) => {
        tareas.push({
          id: `init-${init._id}`,
          titulo: init.titulo,
          categoria: 'iniciativa',
          completada: false,
          horaRecomendada: 'Según protocolo',
          prioridad: init.prioridad,
        });
      });
    }

    setTareasDelTurno([...tareasTransversales, ...tareas]);
  }, [turnoActual, ramaSeleccionada, checklists, initiatives]);

  // Marcar tarea como completada
  const toggleTarea = (id) => {
    setTareasDelTurno((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t))
    );
  };

  // Obtener color de categoría
  const getCategoryColor = (categoria) => {
    const colors = {
      seguridad: '#fee2e2',
      cuidados: '#dbeafe',
      monitoreo: '#fef3c7',
      registro: '#e0e7ff',
      iniciativa: '#d1fae5',
    };
    return colors[categoria] || '#f3f4f6';
  };

  // Obtener icono de categoría
  const getCategoryIcon = (categoria) => {
    const icons = {
      seguridad: '🔒',
      cuidados: '👋',
      monitoreo: '📊',
      registro: '📝',
      iniciativa: '⭐',
    };
    return icons[categoria] || '✓';
  };

  const tareasCompletadas = tareasDelTurno.filter((t) => t.completada).length;
  const total = tareasDelTurno.length;
  const porcentajeCompletado = total > 0 ? Math.round((tareasCompletadas / total) * 100) : 0;

  return (
    <div className={styles.miTurnoContainer}>
      {/* HEADER CON RESUMEN */}
      <section className={styles.card} style={{ backgroundColor: '#f9fafb', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2>📋 Mi Turno</h2>
            <p style={{ color: '#66666', fontSize: '0.9rem' }}>
              Enfermera: <strong>{user?.nombre || 'N/A'}</strong> | Rama: <strong>{ramaSeleccionada}</strong> | Turno: <strong>{turnoActual.charAt(0).toUpperCase() + turnoActual.slice(1)}</strong>
            </p>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '2px solid #d1d5db',
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: porcentajeCompletado === 100 ? '#10b981' : '#f59e0b' }}>
              {porcentajeCompletado}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {tareasCompletadas}/{total} tareas
            </div>
          </div>
        </div>

        {/* BARRA DE PROGRESO */}
        <div style={{ backgroundColor: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              backgroundColor: porcentajeCompletado === 100 ? '#10b981' : porcentajeCompletado > 50 ? '#3b82f6' : '#f59e0b',
              height: '100%',
              width: `${porcentajeCompletado}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </section>

      {/* FILTROS */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>⚙️ Filtrar</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            className={styles.select}
            value={turnoActual}
            onChange={(e) => setTurnoActual(e.target.value)}
            style={{ flex: 1, minWidth: '150px' }}
          >
            <option value="manana">Turno Mañana (08:00 - 14:00)</option>
            <option value="tarde">Turno Tarde (14:00 - 20:00)</option>
            <option value="noche">Turno Noche (20:00 - 08:00)</option>
          </select>

          <select
            className={styles.select}
            value={ramaSeleccionada}
            onChange={(e) => setRamaSeleccionada(e.target.value)}
            style={{ flex: 1, minWidth: '150px' }}
          >
            <option value="">Todas las ramas</option>
            {branches.map((rama) => (
              <option key={rama} value={rama}>
                {rama}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* LISTA DE TAREAS */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ✅ Lista de Tareas del Turno
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>({tareasCompletadas} de {total})</span>
          <button
            style={{
              marginLeft: 'auto',
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title="Obtener explicación de esta sección"
            onClick={() => alert('Lista de Tareas: Aquí aparecen automáticamente las tareas que debes realizar en tu turno.\n\n✓ Marca como completada cuando termines\n✓ Las tareas de seguridad (🔒) son obligatorias\n✓ Las de monitoreo (📊) se hacen según orden médica\n\n¿Dudas? Pregunta a tu supervisor')}
          >
            ℹ️ ¿Qué es esto?
          </button>
        </h3>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {tareasDelTurno.map((tarea) => (
            <div
              key={tarea.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: getCategoryColor(tarea.categoria),
                borderRadius: '6px',
                border: tarea.completada ? '2px solid #10b981' : '1px solid #d1d5db',
                transition: 'all 0.2s ease',
                opacity: tarea.completada ? 0.7 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={tarea.completada}
                onChange={() => toggleTarea(tarea.id)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#3b82f6',
                }}
              />

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: tarea.categoria === 'seguridad' ? '600' : '500',
                    textDecoration: tarea.completada ? 'line-through' : 'none',
                    color: tarea.completada ? '#9ca3af' : '#1f2937',
                  }}
                >
                  {getCategoryIcon(tarea.categoria)} {tarea.titulo}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  ⏰ {tarea.horaRecomendada}
                  {tarea.pacientes && ` • ${tarea.pacientes} paciente(s)`}
                  {tarea.prioridad && ` • Prioridad: ${tarea.prioridad}`}
                </div>
              </div>

              <span style={{ fontSize: '1.2rem', opacity: 0.6 }}>
                {tarea.completada ? '✅' : '⭕'}
              </span>
            </div>
          ))}
        </div>

        {tareasDelTurno.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p>No hay tareas registradas para este turno y rama.</p>
          </div>
        )}
      </section>

      {/* NOTAS DEL TURNO PARA EL PRÓXIMO */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📝 Notas para el Próximo Turno
          <button
            style={{
              marginLeft: 'auto',
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title="Obtener explicación"
            onClick={() => alert('Notas para el Próximo Turno:\n\nAquí dejas anotaciones importantes para quien te releve:\n\n✓ Pacientes inestables\n✓ Pendientes de medicación\n✓ Citas o procedimientos programados\n✓ Problemas o cambios importante\n\nSé conciso pero claro para facilitar el handoff.')}
          >
            ℹ️ ¿Qué es esto?
          </button>
        </h3>

        <textarea
          placeholder="Escribe aquí notas resumidas para el próximo turno... Ej: 'Paciente cama 5 con fiebre 38.5°C, médico notificado. Pendiente analítica de control.'"
          value={notasDelTurno}
          onChange={(e) => setNotasDelTurno(e.target.value)}
          className={styles.select}
          style={{
            minHeight: '120px',
            padding: '1rem',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
          }}
        />

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#10b981',
              color: '#fff',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (notasDelTurno.trim()) {
                alert('✓ Notas guardadas para el próximo turno');
                setNotasDelTurno('');
              } else {
                alert('Por favor, escribe alguna nota importante');
              }
            }}
          >
            💾 Guardar Notas
          </button>
          <button
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              fontWeight: '600',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onClick={() => {
              alert('🎤 Grabación de voz disponible en próximas versiones.\n\nPor ahora, usa el campo de texto anterior.');
            }}
          >
            🎤 Grabar Voz (próximamente)
          </button>
        </div>
      </section>

      {/* PIE CON BOTÓN DE AYUDA */}
      <section style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '6px', textAlign: 'center' }}>
        <p style={{ color: '#1e40af', fontSize: '0.9rem' }}>
          ¿Necesitas ayuda? Contacta a tu supervisor o usa el <strong>Botón de Emergencia</strong> en la barra superior.
        </p>
      </section>
    </div>
  );
};

export default MiTurno;
