import React, { useState } from 'react';
import styles from './Enfermeria.module.css';

// Base de datos local de diagnósticos → protocolos de cuidados
const PROTOCOLOS = {
  neumonia: {
    nombre: 'Neumonía',
    cuidados: [
      { categoria: 'monitoreo', texto: 'Medir saturación de O₂ cada 4 horas (alarma si < 92%)', obligatorio: true },
      { categoria: 'monitoreo', texto: 'Tomar constantes vitales cada 8 horas (TA, FC, FR, temperatura)', obligatorio: true },
      { categoria: 'tratamiento', texto: 'Administrar oxigenoterapia según prescripción médica', obligatorio: true },
      { categoria: 'tratamiento', texto: 'Administrar antibioticoterapia IV en horarios exactos', obligatorio: true },
      { categoria: 'cuidados', texto: 'Fisioterapia respiratoria: drenaje postural y clapping 2 veces/día', obligatorio: false },
      { categoria: 'cuidados', texto: 'Movilización activa o pasiva cada 4 horas (prevenir atelectasias)', obligatorio: false },
      { categoria: 'registro', texto: 'Registrar patrón respiratorio (eupneico, taquipneico, etc.)', obligatorio: true },
      { categoria: 'alta', texto: 'Al alta: educar sobre técnica inhalatoria correcta y completar antibiótico', obligatorio: false },
    ],
  },
  hipertension: {
    nombre: 'Hipertensión arterial',
    cuidados: [
      { categoria: 'monitoreo', texto: 'Tomar TA en ambos brazos al inicio del turno', obligatorio: true },
      { categoria: 'monitoreo', texto: 'Monitorear TA cada 4 horas si es ≥ 160/100', obligatorio: true },
      { categoria: 'tratamiento', texto: 'Administrar antihipertensivos según horario prescrito (no omitir)', obligatorio: true },
      { categoria: 'cuidados', texto: 'Posición semifowler (30-45°) para reducir precarga', obligatorio: false },
      { categoria: 'cuidados', texto: 'Dieta hiposódica: verificar bandeja sin sal', obligatorio: false },
      { categoria: 'registro', texto: 'Registrar gráfica de constantes con valores de TA de cada toma', obligatorio: true },
      { categoria: 'seguridad', texto: 'Prevención de caídas: si TA < 90/60 → reposo absoluto y avisar médico', obligatorio: true },
      { categoria: 'alta', texto: 'Al alta: educar sobre automedicación, seguimiento y estilo de vida', obligatorio: false },
    ],
  },
  diabetes: {
    nombre: 'Diabetes mellitus tipo 2',
    cuidados: [
      { categoria: 'monitoreo', texto: 'Glucemia capilar preprandial (antes de cada comida) y a las 2h', obligatorio: true },
      { categoria: 'monitoreo', texto: 'Vigilar signos de hipoglucemia: sudoración, temblor, confusión', obligatorio: true },
      { categoria: 'tratamiento', texto: 'Administrar insulina o antidiabéticos orales según prescripción', obligatorio: true },
      { categoria: 'tratamiento', texto: 'Si glucemia < 70: 15g de hidratos rápidos y repetir en 15 min', obligatorio: true },
      { categoria: 'cuidados', texto: 'Revisión diaria de pies: color, temperatura, heridas, edema', obligatorio: false },
      { categoria: 'cuidados', texto: 'Hidratación adecuada (si no contraindicado)', obligatorio: false },
      { categoria: 'registro', texto: 'Balance hídrico diario', obligatorio: true },
      { categoria: 'alta', texto: 'Al alta: educar sobre autoinyección de insulina y glucómetro', obligatorio: false },
    ],
  },
  ulceras: {
    nombre: 'Úlceras por presión',
    cuidados: [
      { categoria: 'cuidados', texto: 'Cambios posturales cada 2 horas (registrar posición y hora)', obligatorio: true },
      { categoria: 'cuidados', texto: 'Aplicar ácidos grasos hiperoxigenados en zonas de riesgo', obligatorio: true },
      { categoria: 'cuidados', texto: 'Cura de úlcera existente según protocolo institucional (valorar estadio)', obligatorio: true },
      { categoria: 'monitoreo', texto: 'Valorar escala de Braden al inicio de cada turno', obligatorio: true },
      { categoria: 'monitoreo', texto: 'Fotografiar evolución de úlcera (fecha/hora) para comparar', obligatorio: false },
      { categoria: 'cuidados', texto: 'Colchón antiescaras o superficies especiales si Braden < 14', obligatorio: false },
      { categoria: 'registro', texto: 'Documentar estadio, tamaño, aspecto y tratamiento aplicado', obligatorio: true },
    ],
  },
  sepsis: {
    nombre: 'Sepsis',
    cuidados: [
      { categoria: 'seguridad', texto: '¡URGENTE! Activar Bundle de Sepsis de 1 hora si se sospecha', obligatorio: true },
      { categoria: 'monitoreo', texto: 'Monitoreo continuo: FC, FR, TA, SatO₂, temperatura, diuresis', obligatorio: true },
      { categoria: 'tratamiento', texto: 'Asegurar acceso venoso periférico de gran calibre (14-16G)', obligatorio: true },
      { categoria: 'tratamiento', texto: 'Iniciar fluidoterapia IV según protocolo (30 ml/kg en 3h si hipotensión)', obligatorio: true },
      { categoria: 'tratamiento', texto: 'Extracción de hemocultivos x2 ANTES de iniciar antibiótico', obligatorio: true },
      { categoria: 'monitoreo', texto: 'Medir diuresis horaria (objetivo > 0.5 ml/kg/h)', obligatorio: true },
      { categoria: 'registro', texto: 'Registrar escala SOFA o NEWS al ingreso y cada turno', obligatorio: true },
    ],
  },
  fractura: {
    nombre: 'Fractura (postoperatorio/traumatología)',
    cuidados: [
      { categoria: 'monitoreo', texto: 'Valorar circulación distal: pulso, sensibilidad, movilidad (regla 6P)', obligatorio: true },
      { categoria: 'monitoreo', texto: 'Vigilar signos de embolia grasa (confusión, petequias, disnea)', obligatorio: true },
      { categoria: 'tratamiento', texto: 'Administrar analgesia según escala EVA y prescripción', obligatorio: true },
      { categoria: 'cuidados', texto: 'Elevar extremidad afectada 20-30° sobre el nivel del corazón', obligatorio: false },
      { categoria: 'cuidados', texto: 'Ejercicios isométricos de miembros inmovilizados para evitar atrofia', obligatorio: false },
      { categoria: 'seguridad', texto: 'Profilaxis antitrombótica: HBPM según prescripción y medias compresivas', obligatorio: true },
      { categoria: 'registro', texto: 'Registrar balance hídrico en cirugías mayores', obligatorio: true },
    ],
  },
  ictus: {
    nombre: 'Ictus / ACV',
    cuidados: [
      { categoria: 'monitoreo', texto: 'Valorar nivel de conciencia con Escala de Glasgow cada 2 horas', obligatorio: true },
      { categoria: 'monitoreo', texto: 'Monitorear glucemia: objetivo 140-180 mg/dL (hiper e hipoglucemia empeoran daño)', obligatorio: true },
      { categoria: 'monitoreo', texto: 'TA y FC cada 2 horas (no bajar TA bruscamente en primeras 24h)', obligatorio: true },
      { categoria: 'cuidados', texto: 'Posición cabecera 30° elevada para reducir PIC', obligatorio: true },
      { categoria: 'seguridad', texto: 'Valorar riesgo de disfagia (TEST de disfagia) ANTES de iniciar dieta oral', obligatorio: true },
      { categoria: 'cuidados', texto: 'Movilización pasiva temprana para prevenir espasticidad', obligatorio: false },
      { categoria: 'registro', texto: 'Registrar NIH Stroke Scale o similar al inicio y cada turno', obligatorio: true },
    ],
  },
};

const CATEGORIAS = {
  monitoreo: { label: 'Monitoreo', color: '#fef3c7', icono: '📊' },
  tratamiento: { label: 'Tratamiento', color: '#dbeafe', icono: '💊' },
  cuidados: { label: 'Cuidados', color: '#d1fae5', icono: '👋' },
  seguridad: { label: 'Seguridad', color: '#fee2e2', icono: '🔒' },
  registro: { label: 'Registro', color: '#e0e7ff', icono: '📝' },
  alta: { label: 'Educación al alta', color: '#f3e8ff', icono: '🏠' },
};

const InfoBtn = ({ texto }) => (
  <button
    type="button"
    onClick={() => alert(texto)}
    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', opacity: 0.7 }}
    title="Más información"
  >
    ℹ️
  </button>
);

export default function PlanCuidados() {
  const [busqueda, setBusqueda] = useState('');
  const [diagnosticoSeleccionado, setDiagnosticoSeleccionado] = useState(null);
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState({});
  const [tareaPersonalizada, setTareaPersonalizada] = useState('');
  const [tareasExtra, setTareasExtra] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  const protocolosData = PROTOCOLOS;

  // Buscar diagnósticos que coinciden con la búsqueda
  const resultados = busqueda.trim().length >= 2
    ? Object.entries(protocolosData).filter(([, p]) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : Object.entries(protocolosData);

  const seleccionarDiagnostico = (clave) => {
    const protocolo = protocolosData[clave];
    setDiagnosticoSeleccionado({ clave, ...protocolo });
    // Preseleccionar todas las obligatorias
    const selecciones = {};
    protocolo.cuidados.forEach((c, i) => {
      selecciones[i] = c.obligatorio;
    });
    setTareasSeleccionadas(selecciones);
    setTareasExtra([]);
  };

  const toggleTarea = (index) => {
    setTareasSeleccionadas((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const agregarTareaPersonalizada = () => {
    if (tareaPersonalizada.trim()) {
      setTareasExtra((prev) => [...prev, { texto: tareaPersonalizada.trim(), categoria: 'cuidados' }]);
      setTareaPersonalizada('');
      alert('✓ Tarea personalizada agregada al plan');
    }
  };

  const totalSeleccionadas = Object.values(tareasSeleccionadas).filter(Boolean).length + tareasExtra.length;

  const cuidadosFiltrados = diagnosticoSeleccionado
    ? (filtroCategoria === 'todas'
        ? diagnosticoSeleccionado.cuidados
        : diagnosticoSeleccionado.cuidados.filter((c) => c.categoria === filtroCategoria)
      ).map((c, i) => ({ ...c, indexOriginal: diagnosticoSeleccionado.cuidados.indexOf(c) }))
    : [];

  return (
    <div>
      {/* HEADER */}
      <section className={styles.card} style={{ borderLeft: '4px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>🏥 Plan de Cuidados Inteligente</h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Busca un diagnóstico y el sistema te sugiere automáticamente el plan de cuidados recomendado.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <InfoBtn texto={'Plan de Cuidados Inteligente:\n\n1. Busca un diagnóstico (ej. "neumonía")\n2. El sistema muestra los cuidados recomendados\n3. Marca los que aplican a tu paciente\n4. Agrega cuidados personalizados si necesitas\n\nLos cuidados con 🔴 son OBLIGATORIOS por protocolo.\nLos con ⚪ son recomendados pero opcionales.\n\n¿Dudas sobre algún cuidado? Consulta con tu supervisor.'} />
          </div>
        </div>
      </section>

      {/* BUSCADOR */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>🔍 Buscar diagnóstico</h3>
        <input
          type="text"
          className={styles.select}
          placeholder="Escribe el diagnóstico (ej. neumonía, fractura, sepsis...)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {resultados.map(([clave, protocolo]) => (
            <button
              key={clave}
              type="button"
              onClick={() => seleccionarDiagnostico(clave)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: diagnosticoSeleccionado?.clave === clave ? '#10b981' : '#f3f4f6',
                color: diagnosticoSeleccionado?.clave === clave ? '#fff' : '#1f2937',
                border: '1px solid #d1d5db',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              {protocolo.nombre}
            </button>
          ))}
        </div>
      </section>

      {/* PLAN DE CUIDADOS */}
      {diagnosticoSeleccionado && (
        <section className={styles.card} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h3>📋 Plan para: <strong style={{ color: '#10b981' }}>{diagnosticoSeleccionado.nombre}</strong></h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {totalSeleccionadas} cuidado(s) seleccionado(s) para aplicar este turno
              </p>
            </div>

            {/* FILTRO POR CATEGORÍA */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFiltroCategoria('todas')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', backgroundColor: filtroCategoria === 'todas' ? '#3b82f6' : '#e5e7eb', color: filtroCategoria === 'todas' ? '#fff' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Todos
              </button>
              {Object.entries(CATEGORIAS).map(([clave, cat]) => (
                <button
                  key={clave}
                  type="button"
                  onClick={() => setFiltroCategoria(clave)}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', backgroundColor: filtroCategoria === clave ? '#3b82f6' : '#e5e7eb', color: filtroCategoria === clave ? '#fff' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {cat.icono} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE CUIDADOS */}
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {cuidadosFiltrados.map((cuidado) => {
              const idx = cuidado.indexOriginal;
              const cat = CATEGORIAS[cuidado.categoria] || { color: '#f3f4f6', icono: '•', label: cuidado.categoria };
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem',
                    backgroundColor: cat.color,
                    borderRadius: '6px',
                    border: tareasSeleccionadas[idx] ? '2px solid #10b981' : (cuidado.obligatorio ? '1px solid #f87171' : '1px solid #d1d5db'),
                    opacity: tareasSeleccionadas[idx] === false ? 0.55 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(tareasSeleccionadas[idx])}
                    onChange={() => toggleTarea(idx)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#10b981', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: cuidado.obligatorio ? '600' : '400', fontSize: '0.95rem' }}>
                      {cat.icono} {cuidado.texto}
                    </span>
                    <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#fff', padding: '1px 8px', borderRadius: '10px', color: '#374151' }}>
                        {cat.label}
                      </span>
                      {cuidado.obligatorio && (
                        <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '600' }}>
                          ⚠ Obligatorio por protocolo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {cuidadosFiltrados.length === 0 && (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                No hay cuidados en esta categoría para este diagnóstico.
              </p>
            )}
          </div>

          {/* TAREA PERSONALIZADA */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px dashed #d1d5db' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>
              ➕ Agregar cuidado personalizado
              <InfoBtn texto="Agrega aquí cuidados específicos que no están en la lista automática.\n\nEjemplo:\n- 'Revisar drenaje torácico a las 14h'\n- 'Cura ocular bilateral según orden'\n\nEstos se agregarán al plan de tu turno." />
            </h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className={styles.select}
                placeholder="Escribe el cuidado adicional..."
                value={tareaPersonalizada}
                onChange={(e) => setTareaPersonalizada(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarTareaPersonalizada()}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={agregarTareaPersonalizada}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
              >
                Agregar
              </button>
            </div>

            {tareasExtra.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {tareasExtra.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                    <span style={{ flex: 1, fontSize: '0.9rem' }}>✏️ {t.texto}</span>
                    <button
                      type="button"
                      onClick={() => setTareasExtra((prev) => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* IMPRIMIR / GUARDAR */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const seleccionados = diagnosticoSeleccionado.cuidados
                  .filter((_, i) => tareasSeleccionadas[i])
                  .map((c) => `• [${CATEGORIAS[c.categoria]?.label}] ${c.texto}`)
                  .join('\n');
                const extras = tareasExtra.map((t) => `• [Personalizado] ${t.texto}`).join('\n');
                const contenido = `Plan de Cuidados: ${diagnosticoSeleccionado.nombre}\n\n${seleccionados}${extras ? '\n' + extras : ''}`;
                alert(`📋 Plan de cuidados generado:\n\n${contenido}\n\nCopia este texto en la historia clínica.`);
              }}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              📄 Ver resumen del plan
            </button>
            <button
              type="button"
              onClick={() => { setDiagnosticoSeleccionado(null); setBusqueda(''); }}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
            >
              ↩ Cambiar diagnóstico
            </button>
          </div>
        </section>
      )}

      {/* NOTA INFORMATIVA */}
      {!diagnosticoSeleccionado && (
        <section style={{ marginTop: '1rem', padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
          <p style={{ color: '#1e40af' }}>
            👆 Selecciona un diagnóstico arriba para ver el plan de cuidados sugerido automáticamente.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Los protocolos están basados en guías clínicas estandarizadas. Siempre confirma con el médico tratante antes de aplicar.
          </p>
        </section>
      )}
    </div>
  );
}
