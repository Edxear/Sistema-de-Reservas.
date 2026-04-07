import React, { useMemo, useState } from 'react';
import styles from './Enfermeria.module.css';

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

// Alertas permanentes por categoría de riesgo
const ALERTAS_PERMANENTES = [
  {
    id: 'seg1',
    categoria: 'medicacion',
    severidad: 'alta',
    titulo: 'Medicamentos de alto riesgo requieren doble chequeo',
    descripcion: 'Insulina, heparina, opioides, KCl IV y electrolitos concentrados deben ser verificados por dos profesionales antes de su administración.',
    accion: 'Antes de administrar cualquier medicamento de alto riesgo, pide a un compañero que verifique contigo: paciente, medicamento, dosis, vía, hora.',
  },
  {
    id: 'seg2',
    categoria: 'caidas',
    severidad: 'alta',
    titulo: 'Verificar riesgo de caídas al inicio del turno',
    descripcion: 'Los pacientes con puntuación Morse/Downton ≥45 requieren medidas activas de prevención.',
    accion: 'Revisar: ¿barandillas arriba? ¿timbre al alcance? ¿calzado antideslizante? ¿acompañar al baño? ¿cama en posición baja?',
  },
  {
    id: 'seg3',
    categoria: 'infeccion',
    severidad: 'media',
    titulo: 'Higiene de manos antes de cada contacto con paciente',
    descripcion: 'La higiene de manos es la medida más efectiva para prevenir infecciones nosocomiales. Se realiza en los 5 momentos OMS.',
    accion: 'Los 5 momentos: antes del contacto, antes de procedimiento aséptico, tras exposición a fluidos, después del contacto, después del entorno.',
  },
  {
    id: 'seg4',
    categoria: 'upp',
    severidad: 'media',
    titulo: 'Cambios posturales cada 2 horas en pacientes encamados',
    descripcion: 'Los pacientes con Braden <14 o encamados completos deben recibir cambios posturales programados para prevenir úlceras.',
    accion: 'Registrar cada cambio postural en la hoja de enfermería con hora y posición. Revisar la piel en cada cambio.',
  },
  {
    id: 'seg5',
    categoria: 'sepsis',
    severidad: 'critica',
    titulo: 'Reconocimiento precoz de sepsis',
    descripcion: 'Buscar activamente signos de sepsis en todos los pacientes con infección o fiebre: fiebre/hipotermia + taquicardia + taquipnea + deterioro del estado general.',
    accion: 'Si sospechas sepsis: avisar al médico INMEDIATAMENTE. No esperar resultados. Iniciar Bundle de Sepsis de 1 hora.',
  },
  {
    id: 'seg6',
    categoria: 'medicacion',
    severidad: 'alta',
    titulo: 'Identificación positiva antes de cada medicamento',
    descripcion: 'Confirmar la identidad del paciente con al menos 2 identificadores (nombre completo + fecha de nacimiento o nº historia) antes de administrar cualquier medicación.',
    accion: 'Pedir al paciente que diga su nombre y verificar con la pulsera. No preguntar "¿es usted el señor García?" (el paciente puede decir sí por costumbre).',
  },
  {
    id: 'seg7',
    categoria: 'caidas',
    severidad: 'media',
    titulo: 'Revisión del entorno cada turno',
    descripcion: 'El entorno desordenado y los obstáculos son causa directa de caídas. Especial atención en pacientes con marcha inestable o en planta de geriatría.',
    accion: 'Comprobar: cables en el suelo, calzado apropiado, derrame de líquidos, barandillas del pasillo libres, iluminación nocturna activa.',
  },
  {
    id: 'seg8',
    categoria: 'upp',
    severidad: 'media',
    titulo: 'Aplicar AGHO en zonas de riesgo',
    descripcion: 'Los ácidos grasos hiperoxigenados (AGHO) protegen la piel en zonas de presión. Aplicar en cada turno en sacro, talones y cualquier zona de apoyo prolongado.',
    accion: 'Limpiar y secar la zona, aplicar AGHO en capa fina, no masajear las prominencias óseas directamente.',
  },
  {
    id: 'seg9',
    categoria: 'infeccion',
    severidad: 'alta',
    titulo: 'Revisar indicación diaria de catéteres y sondas',
    descripcion: 'Cada catéter y sonda que permanece más tiempo del necesario aumenta el riesgo de infección. Preguntar cada turno si sigue siendo necesario.',
    accion: '"¿Todavía necesita este paciente el catéter urinario / la vía venosa?" → Si no hay indicación clara, comunicar al médico para considerar retirada.',
  },
  {
    id: 'seg10',
    categoria: 'sepsis',
    severidad: 'critica',
    titulo: 'Monitorizar diuresis en pacientes críticos',
    descripcion: 'Una diuresis <0.5 mL/kg/h indica posible hipoperfusión renal y puede ser signo temprano de shock. Requiere actuación inmediata.',
    accion: 'Medir y registrar diuresis horaria en pacientes con sonda urinaria. Si <0.5 mL/kg/h por 2 horas consecutivas: avisar médico.',
  },
];

// Recordatorios programados por hora del día
const RECORDATORIOS_TURNO = {
  manana: [
    { hora: '07:00', texto: 'Pase de guardia: recibir información del turno noche', icono: '📋' },
    { hora: '08:00', texto: 'Administrar medicación de mañana (verificar hoja de tratamiento)', icono: '💊' },
    { hora: '08:30', texto: 'Toma de constantes vitales y glucemias preprandiales', icono: '📊' },
    { hora: '09:00', texto: 'Higiene de pacientes encamados y cambios posturales', icono: '🛁' },
    { hora: '10:00', texto: 'Revisión de catéteres, sondas y apósitos', icono: '🩺' },
    { hora: '12:00', texto: 'Glucemias preprandiales del almuerzo. Preparar medicación del mediodía', icono: '💊' },
    { hora: '13:30', texto: 'Registros de enfermería del turno de mañana', icono: '📝' },
    { hora: '14:00', texto: 'Preparar pase de guardia para turno tarde', icono: '📋' },
  ],
  tarde: [
    { hora: '14:00', texto: 'Pase de guardia: recibir información del turno mañana', icono: '📋' },
    { hora: '15:00', texto: 'Cambios posturales. Revisar pacientes encamados', icono: '🛁' },
    { hora: '16:00', texto: 'Medicación de tarde. Verificar hoja de tratamiento', icono: '💊' },
    { hora: '17:00', texto: 'Glucemias preprandiales cena', icono: '📊' },
    { hora: '18:00', texto: 'Medicación de la noche (preparar con antelación)', icono: '💊' },
    { hora: '20:00', texto: 'Constantes vitales vespertinas', icono: '📊' },
    { hora: '21:00', texto: 'Registros de enfermería del turno tarde', icono: '📝' },
    { hora: '21:30', texto: 'Pase de guardia para turno noche', icono: '📋' },
  ],
  noche: [
    { hora: '22:00', texto: 'Pase de guardia: recibir información del turno tarde', icono: '📋' },
    { hora: '22:30', texto: 'Administrar medicación nocturna', icono: '💊' },
    { hora: '23:00', texto: 'Revisión de pacientes: constantes, dolor, posición', icono: '📊' },
    { hora: '02:00', texto: 'Cambios posturales. Vigilancia ronda nocturna', icono: '🛁' },
    { hora: '04:00', texto: 'Ronda de vigilancia. Pacientes críticos: monitoreo', icono: '👁️' },
    { hora: '06:00', texto: 'Glucemias y constantes matutinas', icono: '📊' },
    { hora: '07:00', texto: 'Preparar pase de guardia para turno mañana', icono: '📋' },
  ],
};

const CATEGORIAS_ALERTA = {
  medicacion: { label: 'Medicación segura', color: '#fef3c7', colorBorde: '#f59e0b', icono: '💊' },
  caidas: { label: 'Prevención de caídas', color: '#dbeafe', colorBorde: '#3b82f6', icono: '🚶' },
  infeccion: { label: 'Control de infecciones', color: '#d1fae5', colorBorde: '#10b981', icono: '🧫' },
  upp: { label: 'Úlceras por presión', color: '#ede9fe', colorBorde: '#8b5cf6', icono: '🛏️' },
  sepsis: { label: 'Sepsis / Deterioro', color: '#fee2e2', colorBorde: '#ef4444', icono: '🚨' },
};

const SEVERIDAD = {
  critica: { label: 'CRÍTICA', color: '#dc2626', bg: '#fee2e2' },
  alta: { label: 'Alta', color: '#ea580c', bg: '#ffedd5' },
  media: { label: 'Media', color: '#ca8a04', bg: '#fef9c3' },
};

export default function AlertasSeguridad() {
  const [turnoActivo, setTurnoActivo] = useState(() => {
    const h = new Date().getHours();
    if (h >= 7 && h < 14) return 'manana';
    if (h >= 14 && h < 22) return 'tarde';
    return 'noche';
  });
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [alertasConfirmadas, setAlertasConfirmadas] = useState({});
  const [recordatoriosVistos, setRecordatoriosVistos] = useState({});

  const alertasData = ALERTAS_PERMANENTES;
  const recordatoriosData = RECORDATORIOS_TURNO;

  const alertasFiltradas = useMemo(() => {
    return alertasData.filter((a) =>
      categoriaFiltro === 'todas' || a.categoria === categoriaFiltro
    ).sort((a, b) => {
      const orden = { critica: 0, alta: 1, media: 2 };
      return (orden[a.severidad] ?? 3) - (orden[b.severidad] ?? 3);
    });
  }, [categoriaFiltro, alertasData]);

  const recordatoriosTurno = recordatoriosData[turnoActivo] || [];

  const confirmarAlerta = (id) => {
    setAlertasConfirmadas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const marcarRecordatorio = (hora) => {
    setRecordatoriosVistos((prev) => ({ ...prev, [hora]: !prev[hora] }));
  };

  const totalConfirmadas = Object.values(alertasConfirmadas).filter(Boolean).length;
  const totalAlertas = alertasData.length;

  return (
    <div>
      {/* HEADER */}
      <section className={styles.card} style={{ borderLeft: '4px solid #ef4444' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>⚠️ Alertas de Seguridad del Paciente</h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Recordatorios activos de seguridad para tu turno. Márcalos como revisados a medida que los verificas.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <InfoBtn texto={'Alertas de Seguridad:\n\nEsta sección muestra los puntos de seguridad más importantes que debes tener presentes en cada turno.\n\n• Las alertas CRÍTICAS son prioritarias y no deben ignorarse\n• Marca cada alerta cuando la hayas verificado/aplicado\n• La barra de progreso muestra cuántos puntos de seguridad has revisado\n\nEstas alertas NO reemplazan los protocolos del servicio ni las indicaciones médicas. Son recordatorios de buenas prácticas.'} />
          </div>
        </div>

        {/* PROGRESO */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.4rem' }}>
            <span>Puntos de seguridad verificados este turno</span>
            <span style={{ fontWeight: '700', color: totalConfirmadas === totalAlertas ? '#10b981' : '#374151' }}>{totalConfirmadas} / {totalAlertas}</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '999px', backgroundColor: totalConfirmadas === totalAlertas ? '#10b981' : totalConfirmadas > totalAlertas / 2 ? '#3b82f6' : '#f59e0b', width: `${(totalConfirmadas / totalAlertas) * 100}%`, transition: 'width 0.4s' }} />
          </div>
        </div>
      </section>

      {/* SELECTOR DE TURNO */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3>🕐 Recordatorios del turno</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['manana', 'tarde', 'noche'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTurnoActivo(t); setRecordatoriosVistos({}); }}
                style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', backgroundColor: turnoActivo === t ? '#1f2937' : '#e5e7eb', color: turnoActivo === t ? '#fff' : '#374151' }}
              >
                {t === 'manana' ? '🌅 Mañana' : t === 'tarde' ? '🌆 Tarde' : '🌙 Noche'}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
          Horarios orientativos. Adapta al protocolo de tu servicio.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recordatoriosTurno.map((rec) => (
            <div
              key={rec.hora}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: recordatoriosVistos[rec.hora] ? '#f0fdf4' : '#f9fafb', borderRadius: '6px', border: `1px solid ${recordatoriosVistos[rec.hora] ? '#bbf7d0' : '#e5e7eb'}`, opacity: recordatoriosVistos[rec.hora] ? 0.7 : 1, cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => marcarRecordatorio(rec.hora)}
            >
              <input
                type="checkbox"
                checked={Boolean(recordatoriosVistos[rec.hora])}
                onChange={() => marcarRecordatorio(rec.hora)}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '18px', height: '18px', accentColor: '#10b981', flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{rec.icono}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.85rem', marginRight: '0.5rem' }}>{rec.hora}</span>
                <span style={{ color: '#374151', fontSize: '0.9rem', textDecoration: recordatoriosVistos[rec.hora] ? 'line-through' : 'none' }}>{rec.texto}</span>
              </div>
              {recordatoriosVistos[rec.hora] && <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 }}>✓ Listo</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ALERTAS DE SEGURIDAD */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h3>🛡️ Puntos críticos de seguridad</h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setCategoriaFiltro('todas')}
              style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', backgroundColor: categoriaFiltro === 'todas' ? '#374151' : '#e5e7eb', color: categoriaFiltro === 'todas' ? '#fff' : '#374151' }}
            >
              Todas
            </button>
            {Object.entries(CATEGORIAS_ALERTA).map(([clave, cat]) => (
              <button
                key={clave}
                type="button"
                onClick={() => setCategoriaFiltro(clave)}
                style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: `2px solid ${cat.colorBorde}`, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', backgroundColor: categoriaFiltro === clave ? cat.colorBorde : '#fff', color: categoriaFiltro === clave ? '#fff' : cat.colorBorde }}
              >
                {cat.icono} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alertasFiltradas.map((alerta) => {
            const cat = CATEGORIAS_ALERTA[alerta.categoria];
            const sev = SEVERIDAD[alerta.severidad];
            const confirmada = alertasConfirmadas[alerta.id];
            return (
              <div
                key={alerta.id}
                style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: confirmada ? '#f9fafb' : cat.color, borderRadius: '8px', border: `1px solid ${confirmada ? '#e5e7eb' : cat.colorBorde}`, opacity: confirmada ? 0.65 : 1, transition: 'all 0.2s', cursor: 'pointer' }}
                onClick={() => confirmarAlerta(alerta.id)}
              >
                <input
                  type="checkbox"
                  checked={Boolean(confirmada)}
                  onChange={() => confirmarAlerta(alerta.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '20px', height: '20px', accentColor: '#10b981', flexShrink: 0, marginTop: '2px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1rem' }}>{cat.icono}</span>
                    <span style={{ fontWeight: '700', color: confirmada ? '#6b7280' : '#111827', textDecoration: confirmada ? 'line-through' : 'none' }}>
                      {alerta.titulo}
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', backgroundColor: sev.bg, color: sev.color }}>
                      {sev.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: cat.color, color: cat.colorBorde, fontWeight: '600' }}>
                      {cat.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: '0 0 0.4rem' }}>{alerta.descripcion}</p>
                  <div style={{ fontSize: '0.85rem', color: '#374151', backgroundColor: 'rgba(255,255,255,0.7)', padding: '0.4rem 0.75rem', borderRadius: '4px', borderLeft: `3px solid ${cat.colorBorde}` }}>
                    <strong>Qué hacer:</strong> {alerta.accion}
                  </div>
                </div>
                {confirmada && (
                  <div style={{ color: '#10b981', fontWeight: '800', fontSize: '1.25rem', flexShrink: 0, alignSelf: 'center' }}>✓</div>
                )}
              </div>
            );
          })}
        </div>

        {totalConfirmadas === totalAlertas && totalAlertas > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '2px solid #10b981', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>✅</div>
            <div style={{ fontWeight: '700', color: '#065f46', fontSize: '1.1rem', marginTop: '0.25rem' }}>
              ¡Todos los puntos de seguridad verificados!
            </div>
            <p style={{ color: '#047857', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Excelente trabajo. Recuerda re-verificar a mitad del turno si hay cambios en los pacientes.
            </p>
          </div>
        )}
      </section>

      {/* RESUMEN POR CATEGORÍA */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📊 Resumen por área de seguridad</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(CATEGORIAS_ALERTA).map(([clave, cat]) => {
            const alertasCat = alertasData.filter((a) => a.categoria === clave);
            const confirmadas = alertasCat.filter((a) => alertasConfirmadas[a.id]).length;
            const pct = alertasCat.length > 0 ? Math.round((confirmadas / alertasCat.length) * 100) : 0;
            return (
              <div key={clave} style={{ padding: '1rem', backgroundColor: cat.color, borderRadius: '8px', border: `1px solid ${cat.colorBorde}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{cat.icono}</span>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: pct === 100 ? '#10b981' : cat.colorBorde }}>{pct}%</span>
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.82rem', color: '#1f2937', marginBottom: '0.35rem' }}>{cat.label}</div>
                <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '999px', backgroundColor: pct === 100 ? '#10b981' : cat.colorBorde, width: `${pct}%`, transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{confirmadas}/{alertasCat.length} verificados</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
