import React, { useState } from 'react';
import styles from './Enfermeria.module.css';

/* ─── Escalas de evaluación ──────────────────────────────────────── */
const ESCALA_HAMILTON_ITEMS = [
  { key: 'humor_depresivo', label: 'Humor depresivo (tristeza, desesperanza, inutilidad)' },
  { key: 'culpabilidad', label: 'Sentimientos de culpa' },
  { key: 'suicidio', label: 'Ideación / conducta suicida' },
  { key: 'insomnio_precoz', label: 'Insomnio precoz (conciliar el sueño)' },
  { key: 'insomnio_medio', label: 'Insomnio medio (despertares nocturnos)' },
  { key: 'insomnio_tardio', label: 'Insomnio tardío (madrugada)' },
  { key: 'trabajo_actividades', label: 'Trabajo y actividades (interés, energía)' },
  { key: 'retardo', label: 'Retardo psicomotor (lentitud pensamiento/habla)' },
  { key: 'agitacion', label: 'Agitación psicomotora' },
  { key: 'ansiedad_psiquica', label: 'Ansiedad psíquica' },
  { key: 'ansiedad_somatica', label: 'Ansiedad somática' },
  { key: 'sintomas_gastrointestinales', label: 'Síntomas gastrointestinales' },
  { key: 'sintomas_generales', label: 'Síntomas somáticos generales (fatiga, dolor)' },
  { key: 'sintomas_genitales', label: 'Síntomas genitales (libido, ciclo menstrual)' },
  { key: 'hipocondria', label: 'Hipocondría' },
  { key: 'perdida_peso', label: 'Pérdida de peso' },
  { key: 'insight', label: 'Conciencia de enfermedad (insight)' },
];

const ESCALA_BPRS_ITEMS = [
  { key: 'preocupacion_somatica', label: 'Preocupación somática' },
  { key: 'ansiedad', label: 'Ansiedad' },
  { key: 'retraimiento', label: 'Retraimiento emocional' },
  { key: 'desorganizacion', label: 'Desorganización conceptual' },
  { key: 'autovaloracion', label: 'Autovaloración' },
  { key: 'depresion', label: 'Depresión' },
  { key: 'retardo_motor', label: 'Retardo motor' },
  { key: 'no_cooperacion', label: 'No cooperación' },
  { key: 'contenido_inusual', label: 'Contenido del pensamiento inusual' },
  { key: 'desorientacion', label: 'Desorientación' },
  { key: 'afecto_embotado', label: 'Afecto embotado' },
  { key: 'excitacion', label: 'Excitación' },
  { key: 'hostilidad', label: 'Hostilidad' },
  { key: 'suspicacia', label: 'Suspicacia' },
  { key: 'alucinaciones', label: 'Comportamiento alucinatorio' },
  { key: 'lentitud', label: 'Lentitud motora' },
  { key: 'afecto_inadecuado', label: 'Afecto inadecuado' },
  { key: 'contenido_pensamiento', label: 'Contenido del pensamiento' },
];

const RIESGO_SUICIDA_ITEMS = [
  { key: 'ideacion_actual', label: 'Ideación suicida activa en las últimas 24 h' },
  { key: 'plan', label: 'Tiene plan estructurado' },
  { key: 'acceso_medios', label: 'Acceso a medios letales' },
  { key: 'intento_previo', label: 'Antecedente de intento previo' },
  { key: 'hopelessness', label: 'Desesperanza marcada' },
  { key: 'aislamiento', label: 'Aislamiento social severo' },
  { key: 'abuso_sustancias', label: 'Abuso de sustancias actual' },
  { key: 'precipitante_reciente', label: 'Evento precipitante reciente (pérdida, trauma)' },
];

const COMPORTAMIENTO_TIPOS = [
  'Agitación', 'Alucinaciones verbales', 'Alucinaciones visuales', 'Confusión',
  'Crisis disociativa', 'Deambulación nocturna', 'Delirio', 'Fuga de ideas',
  'Heteroagresividad', 'Inhibición psicomotriz', 'Llanto persistente',
  'Mutismo', 'Negativa a medicación', 'Negativa a alimentación', 'Otro',
];

const CONTENCION_TIPOS = ['Verbal', 'Farmacológica', 'Física - decúbito dorsal', 'Física - sentado'];

const initialHamilton = () => Object.fromEntries(ESCALA_HAMILTON_ITEMS.map((i) => [i.key, 0]));
const initialBprs = () => Object.fromEntries(ESCALA_BPRS_ITEMS.map((i) => [i.key, 1]));
const initialRiesgo = () => Object.fromEntries(RIESGO_SUICIDA_ITEMS.map((i) => [i.key, false]));

const TABS = [
  { key: 'riesgo', label: '⚠️ Riesgo suicida' },
  { key: 'hamilton', label: '📋 Escala Hamilton' },
  { key: 'bprs', label: '📋 Escala BPRS' },
  { key: 'comportamiento', label: '📝 Registro conducta' },
  { key: 'medicacion', label: '💊 Medicación psiq.' },
  { key: 'contencion', label: '🛡️ Contención' },
  { key: 'protocolo', label: '📖 Protocolos' },
];

/* ─── Protocolos de referencia ───────────────────────────────────── */
const PROTOCOLOS = [
  {
    titulo: 'Protocolo de crisis suicida',
    pasos: [
      'Notificar inmediatamente al médico psiquiatra de guardia.',
      'Retirar objetos de riesgo del ambiente (cinturones, cubiertos, cables).',
      'No dejar al paciente solo: vigilancia continua 1:1.',
      'Administrar medicación de rescate según orden médica (ej: Lorazepam 1 mg VO/SL).',
      'Registrar hora, síntomas, intervención y respuesta en la historia clínica.',
      'Informar a familiar/tutor si el paciente lo consiente o si hay riesgo inminente.',
      'Comunicar al equipo multidisciplinario en próxima reunión de pase.',
    ],
  },
  {
    titulo: 'Protocolo de agitación psicomotriz',
    pasos: [
      'Aproximación calmada, ambiente tranquilo con baja estimulación.',
      'Contención verbal: tono pausado, escucha activa, validar emociones.',
      'Si no cede: contención farmacológica según orden médica (Haloperidol / Olanzapina / BZD).',
      'Si hay riesgo para el paciente u otros: contención física con técnica apropiada y mínimo 4 personas.',
      'Documentar tipo de contención, duración, personas intervinientes y respuesta.',
      'Monitoreo de constantes cada 15 min durante contención física.',
      'Notificar a jefatura de turno y registrar en HCl.',
    ],
  },
  {
    titulo: 'Protocolo pase de guardia en Salud Mental',
    pasos: [
      'Verificar estado de cada paciente: humor, sueño, alimentación, conducta últimas 8 h.',
      'Informar ingresos, egresos y traslados del turno.',
      'Comunicar pacientes bajo vigilancia especial (riesgo suicida, agitación).',
      'Verificar administración de medicación de alta complejidad (Litio, Clozapina).',
      'Revisar órdenes médicas pendientes.',
      'Firmar registro de pase en libro correspondiente.',
    ],
  },
  {
    titulo: 'Manejo seguro de Clozapina',
    pasos: [
      'Verificar resultado de hemograma semanal (recuento de granulocitos > 1500/mm³).',
      'Administrar con comida para minimizar náuseas.',
      'Vigilar síntomas de agranulocitosis: fiebre, odinofagia, malestar.',
      'Monitorear hipotensión ortostática las primeras horas post-dosis.',
      'Nunca suspender bruscamente; comunicar al médico si el paciente rechaza la dosis.',
      'Registrar lot del blíster y firma en planilla de psicotrópicos.',
    ],
  },
  {
    titulo: 'Evaluación de adherencia al tratamiento',
    pasos: [
      'Observar deglución de medicación oral; verificar que no haya retención sublingual.',
      'Registrar rechazos en hoja de enfermería y comunicar al médico.',
      'Indagar motivos del rechazo (efectos adversos, desconfianza) sin actitud coercitiva.',
      'Documentar en HCl: medicamento, dosis, vía, hora y respuesta del paciente.',
    ],
  },
];

const PSICOFÁRMACOS_COMUNES = [
  { nombre: 'Haloperidol 5 mg', via: 'VO / IM', uso: 'Antipsicótico típico. Agitación, psicosis aguda.' },
  { nombre: 'Olanzapina 10 mg', via: 'VO / IM', uso: 'Antipsicótico atípico. Esquizofrenia, manía.' },
  { nombre: 'Risperidona 2 mg', via: 'VO', uso: 'Antipsicótico atípico. Esquizofrenia, autismo.' },
  { nombre: 'Clozapina 100 mg', via: 'VO', uso: 'Esquizofrenia refractaria. Requiere monitoreo hemático.' },
  { nombre: 'Quetiapina 50 mg', via: 'VO', uso: 'Antipsicótico atípico. Bipolar, depresión mayor.' },
  { nombre: 'Carbonato de Litio 300 mg', via: 'VO', uso: 'Estabilizador del ánimo. Monitorear litemia.' },
  { nombre: 'Valproato sódico 500 mg', via: 'VO', uso: 'Estabilizador. Epilepsia, manía. Hepatotoxicidad.' },
  { nombre: 'Fluoxetina 20 mg', via: 'VO', uso: 'ISRS. Depresión, TOC, bulimia.' },
  { nombre: 'Sertralina 50 mg', via: 'VO', uso: 'ISRS. Depresión, ansiedad, TEPT.' },
  { nombre: 'Escitalopram 10 mg', via: 'VO', uso: 'ISRS. Depresión, TAG.' },
  { nombre: 'Lorazepam 1 mg', via: 'VO / SL / IM', uso: 'BZD. Ansiedad aguda, agitación, rescate.' },
  { nombre: 'Diazepam 5 mg', via: 'VO / IV / IM', uso: 'BZD. Ansiedad, síndrome de abstinencia.' },
  { nombre: 'Clonazepam 0.5 mg', via: 'VO / SL', uso: 'BZD. Ansiedad, crisis de pánico, epilepsia.' },
  { nombre: 'Prometazina 25 mg', via: 'IM', uso: 'Sedante antihistamínico. Agitación coadyuvante.' },
  { nombre: 'Biperideno 2 mg', via: 'VO / IM', uso: 'Anticolinérgico. Efectos extrapiramidales.' },
];

/* ──────────────────────────────────────────────────────────────────── */

export default function SaludMental() {
  const [activeTab, setActiveTab] = useState('riesgo');

  /* Evaluación de riesgo suicida */
  const [riesgo, setRiesgo] = useState(initialRiesgo());
  const [riesgoNota, setRiesgoNota] = useState('');
  const [riesgoPaciente, setRiesgoPaciente] = useState('');

  /* Escalas */
  const [hamilton, setHamilton] = useState(initialHamilton());
  const [bprs, setBprs] = useState(initialBprs());
  const [escalaPaciente, setEscalaPaciente] = useState('');

  /* Registro de conducta */
  const [conductaForm, setConductaForm] = useState({ paciente: '', tipo: '', descripcion: '', hora: '' });
  const [conductaRegistros, setConductaRegistros] = useState([]);

  /* Medicación */
  const [medFilter, setMedFilter] = useState('');

  /* Contención */
  const [contencionForm, setContencionForm] = useState({
    paciente: '', tipo: 'Verbal', duracion: '', personal: '', resultado: '', observaciones: '',
  });
  const [contencionRegistros, setContencionRegistros] = useState([]);

  /* Protocolo */
  const [protocoloAbierto, setProtocoloAbierto] = useState(null);

  /* ─── Cálculos ────────────────────────────────────────────────── */
  const totalHamilton = Object.values(hamilton).reduce((a, b) => a + Number(b), 0);
  const severidadHamilton = totalHamilton <= 7 ? 'Sin depresión' : totalHamilton <= 17 ? 'Leve' : totalHamilton <= 24 ? 'Moderada' : 'Severa';
  const colorHamilton = totalHamilton <= 7 ? '#22c55e' : totalHamilton <= 17 ? '#f59e0b' : totalHamilton <= 24 ? '#f97316' : '#ef4444';

  const totalBprs = Object.values(bprs).reduce((a, b) => a + Number(b), 0);
  const severidadBprs = totalBprs < 31 ? 'Sin psicopatología / Leve' : totalBprs < 41 ? 'Moderada' : totalBprs < 53 ? 'Moderadamente severa' : 'Severa';
  const colorBprs = totalBprs < 31 ? '#22c55e' : totalBprs < 41 ? '#f59e0b' : totalBprs < 53 ? '#f97316' : '#ef4444';

  const factoResRiesgo = Object.values(riesgo).filter(Boolean).length;
  const nivelRiesgo = factoResRiesgo === 0 ? 'Sin factores' : factoResRiesgo <= 2 ? 'Bajo' : factoResRiesgo <= 5 ? 'Moderado' : 'Alto';
  const colorRiesgo = factoResRiesgo === 0 ? '#22c55e' : factoResRiesgo <= 2 ? '#f59e0b' : factoResRiesgo <= 5 ? '#f97316' : '#ef4444';

  /* ─── Handlers ────────────────────────────────────────────────── */
  const handleGuardarConducta = (e) => {
    e.preventDefault();
    if (!conductaForm.paciente.trim() || !conductaForm.tipo) return;
    setConductaRegistros((prev) => [
      { ...conductaForm, id: Date.now(), hora: conductaForm.hora || new Date().toLocaleTimeString() },
      ...prev,
    ]);
    setConductaForm({ paciente: '', tipo: '', descripcion: '', hora: '' });
  };

  const handleGuardarContencion = (e) => {
    e.preventDefault();
    if (!contencionForm.paciente.trim()) return;
    setContencionRegistros((prev) => [
      { ...contencionForm, id: Date.now(), timestamp: new Date().toLocaleString() },
      ...prev,
    ]);
    setContencionForm({ paciente: '', tipo: 'Verbal', duracion: '', personal: '', resultado: '', observaciones: '' });
  };

  const medsFiltrados = PSICOFÁRMACOS_COMUNES.filter((m) =>
    m.nombre.toLowerCase().includes(medFilter.toLowerCase()) ||
    m.uso.toLowerCase().includes(medFilter.toLowerCase()),
  );

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <section className={styles.card} style={{ marginTop: '1rem' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#1e3a5f' }}>🧠 Área de Salud Mental</h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4f6c87' }}>
          Herramientas clínicas del turno: evaluación de riesgo, escalas, registro de conducta, medicación psiquiátrica y protocolos.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === tab.key ? '#7c3aed' : '#e5e7eb',
              color: activeTab === tab.key ? '#fff' : '#1f2937',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Riesgo suicida ── */}
      {activeTab === 'riesgo' && (
        <div className={styles.grid} style={{ gap: '1rem' }}>
          <div className={styles.card} style={{ border: '1px solid #fca5a5' }}>
            <h3 style={{ marginTop: 0, color: '#991b1b' }}>Evaluación de riesgo suicida</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: 0 }}>
              Marcar los factores presentes. No reemplaza la evaluación médica.
            </p>
            <input
              className={styles.select}
              placeholder="Nombre / referencia del paciente"
              value={riesgoPaciente}
              onChange={(e) => setRiesgoPaciente(e.target.value)}
              style={{ marginBottom: '10px', width: '100%' }}
            />
            <div className={styles.ratingGrid}>
              {RIESGO_SUICIDA_ITEMS.map((item) => (
                <label key={item.key} className={styles.checkline} style={{ cursor: 'pointer', padding: '6px 4px' }}>
                  <input
                    type="checkbox"
                    checked={riesgo[item.key]}
                    onChange={(e) => setRiesgo((p) => ({ ...p, [item.key]: e.target.checked }))}
                  />
                  <span style={{ fontSize: '13px' }}>{item.label}</span>
                </label>
              ))}
            </div>

            <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: '#fff', border: `2px solid ${colorRiesgo}`, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: colorRiesgo, fontSize: '15px' }}>
                Nivel de riesgo: {nivelRiesgo}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {factoResRiesgo} factor{factoResRiesgo !== 1 ? 'es' : ''} presente{factoResRiesgo !== 1 ? 's' : ''}
              </span>
            </div>

            {factoResRiesgo >= 3 && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', color: '#991b1b', fontWeight: 600 }}>
                ⚠️ Notificar al psiquiatra de guardia y activar protocolo de crisis suicida.
              </div>
            )}

            <textarea
              className={styles.textarea}
              placeholder="Observaciones adicionales / contexto clínico"
              value={riesgoNota}
              onChange={(e) => setRiesgoNota(e.target.value)}
              style={{ marginTop: '10px', width: '100%' }}
            />
            <button
              type="button"
              className={styles.primaryBtn}
              style={{ marginTop: '6px', width: '100%' }}
              onClick={() => {
                alert(`Evaluación registrada localmente.\nPaciente: ${riesgoPaciente || 'N/A'}\nNivel: ${nivelRiesgo}\nFactores: ${factoResRiesgo}`);
              }}
            >
              Registrar evaluación
            </button>
          </div>
        </div>
      )}

      {/* ── Escala Hamilton ── */}
      {activeTab === 'hamilton' && (
        <div>
          <h3 style={{ marginTop: 0 }}>Escala de Hamilton para Depresión (HAM-D 17)</h3>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>Puntuar 0–4 por ítem. Total: 0–52.</p>
          <input
            className={styles.select}
            placeholder="Paciente"
            value={escalaPaciente}
            onChange={(e) => setEscalaPaciente(e.target.value)}
            style={{ marginBottom: '10px', width: '100%' }}
          />
          <div className={styles.ratingGrid}>
            {ESCALA_HAMILTON_ITEMS.map((item) => (
              <div key={item.key} className={styles.ratingRow}>
                <span className={styles.ratingLabel} style={{ fontSize: '13px' }}>{item.label}</span>
                <div className={styles.ratingStarsWrap}>
                  {[0, 1, 2, 3, 4].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={styles.primaryBtn}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: hamilton[item.key] === val ? '#115894' : '#e5e7eb',
                        color: hamilton[item.key] === val ? '#fff' : '#374151',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        minWidth: '28px',
                      }}
                      onClick={() => setHamilton((p) => ({ ...p, [item.key]: val }))}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: '#f8faff', border: `2px solid ${colorHamilton}`, display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '18px', color: colorHamilton }}>Total: {totalHamilton}</span>
            <span style={{ fontWeight: 600, color: colorHamilton }}>{severidadHamilton}</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Referencia: 0–7 sin dep. | 8–17 leve | 18–24 moderada | ≥25 severa</span>
          </div>
        </div>
      )}

      {/* ── Escala BPRS ── */}
      {activeTab === 'bprs' && (
        <div>
          <h3 style={{ marginTop: 0 }}>Brief Psychiatric Rating Scale (BPRS)</h3>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>Puntuar 1–7 por ítem. Total: 18–126.</p>
          <input
            className={styles.select}
            placeholder="Paciente"
            value={escalaPaciente}
            onChange={(e) => setEscalaPaciente(e.target.value)}
            style={{ marginBottom: '10px', width: '100%' }}
          />
          <div className={styles.ratingGrid}>
            {ESCALA_BPRS_ITEMS.map((item) => (
              <div key={item.key} className={styles.ratingRow}>
                <span className={styles.ratingLabel} style={{ fontSize: '13px' }}>{item.label}</span>
                <div className={styles.ratingStarsWrap} style={{ gap: '4px' }}>
                  {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                    <button
                      key={val}
                      type="button"
                      style={{
                        padding: '3px 6px',
                        fontSize: '11px',
                        background: bprs[item.key] === val ? '#115894' : '#e5e7eb',
                        color: bprs[item.key] === val ? '#fff' : '#374151',
                        borderRadius: '5px',
                        border: 'none',
                        cursor: 'pointer',
                        minWidth: '24px',
                      }}
                      onClick={() => setBprs((p) => ({ ...p, [item.key]: val }))}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: '#f8faff', border: `2px solid ${colorBprs}`, display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '18px', color: colorBprs }}>Total: {totalBprs}</span>
            <span style={{ fontWeight: 600, color: colorBprs }}>{severidadBprs}</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Referencia: &lt;31 leve | 31–40 moderada | 41–52 mod-severa | ≥53 severa</span>
          </div>
        </div>
      )}

      {/* ── Registro de conducta ── */}
      {activeTab === 'comportamiento' && (
        <div>
          <h3 style={{ marginTop: 0 }}>Registro de conducta / comportamiento</h3>
          <form onSubmit={handleGuardarConducta} className={styles.gridForm} style={{ marginBottom: '1rem' }}>
            <input
              className={styles.input}
              placeholder="Paciente / referencia"
              value={conductaForm.paciente}
              onChange={(e) => setConductaForm((p) => ({ ...p, paciente: e.target.value }))}
              required
            />
            <select
              className={styles.select}
              value={conductaForm.tipo}
              onChange={(e) => setConductaForm((p) => ({ ...p, tipo: e.target.value }))}
              required
            >
              <option value="">Seleccionar conducta</option>
              {COMPORTAMIENTO_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              type="time"
              className={styles.input}
              value={conductaForm.hora}
              onChange={(e) => setConductaForm((p) => ({ ...p, hora: e.target.value }))}
            />
            <textarea
              className={styles.textarea}
              placeholder="Descripción del episodio / contexto / intervención realizada"
              value={conductaForm.descripcion}
              onChange={(e) => setConductaForm((p) => ({ ...p, descripcion: e.target.value }))}
            />
            <button type="submit" className={styles.primaryBtn} style={{ gridColumn: '1 / -1' }}>
              Registrar episodio
            </button>
          </form>

          {conductaRegistros.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '13px' }}>Sin registros en esta sesión.</p>
          ) : (
            <div className={styles.listWrap}>
              {conductaRegistros.map((r) => (
                <div key={r.id} className={styles.item}>
                  <div className={styles.itemTitle}>{r.tipo} — {r.paciente}</div>
                  <div className={styles.metaMini}>Hora: {r.hora}</div>
                  {r.descripcion && <div style={{ fontSize: '13px' }}>{r.descripcion}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Medicación psiquiátrica ── */}
      {activeTab === 'medicacion' && (
        <div>
          <h3 style={{ marginTop: 0 }}>Referencia rápida de psicofármacos</h3>
          <input
            className={styles.input}
            placeholder="Buscar por nombre o indicación..."
            value={medFilter}
            onChange={(e) => setMedFilter(e.target.value)}
            style={{ marginBottom: '10px', width: '100%' }}
          />
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Siempre verificar orden médica y planilla de psicotrópicos antes de administrar. Registrar lote y firma.
          </div>
          <div className={styles.listWrap} style={{ maxHeight: '420px' }}>
            {medsFiltrados.map((m) => (
              <div key={m.nombre} className={styles.item}>
                <div className={styles.itemTitle}>{m.nombre}</div>
                <div style={{ fontSize: '12px', color: '#3b7abd' }}>Vía: {m.via}</div>
                <div style={{ fontSize: '13px', color: '#374151' }}>{m.uso}</div>
              </div>
            ))}
            {medsFiltrados.length === 0 && (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>Sin resultados para "{medFilter}".</p>
            )}
          </div>
        </div>
      )}

      {/* ── Contención ── */}
      {activeTab === 'contencion' && (
        <div>
          <h3 style={{ marginTop: 0 }}>Registro de contención</h3>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: 0 }}>
            Documentar toda contención física o farmacológica según normativa institucional.
          </p>
          <form onSubmit={handleGuardarContencion} className={styles.gridForm} style={{ marginBottom: '1rem' }}>
            <input
              className={styles.input}
              placeholder="Paciente / referencia"
              value={contencionForm.paciente}
              onChange={(e) => setContencionForm((p) => ({ ...p, paciente: e.target.value }))}
              required
            />
            <select
              className={styles.select}
              value={contencionForm.tipo}
              onChange={(e) => setContencionForm((p) => ({ ...p, tipo: e.target.value }))}
            >
              {CONTENCION_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              className={styles.input}
              placeholder="Duración (ej: 30 min)"
              value={contencionForm.duracion}
              onChange={(e) => setContencionForm((p) => ({ ...p, duracion: e.target.value }))}
            />
            <input
              className={styles.input}
              placeholder="Personal interviniente"
              value={contencionForm.personal}
              onChange={(e) => setContencionForm((p) => ({ ...p, personal: e.target.value }))}
            />
            <input
              className={styles.input}
              placeholder="Resultado / respuesta del paciente"
              value={contencionForm.resultado}
              onChange={(e) => setContencionForm((p) => ({ ...p, resultado: e.target.value }))}
            />
            <textarea
              className={styles.textarea}
              placeholder="Observaciones adicionales"
              value={contencionForm.observaciones}
              onChange={(e) => setContencionForm((p) => ({ ...p, observaciones: e.target.value }))}
            />
            <button type="submit" className={styles.primaryBtn} style={{ gridColumn: '1 / -1' }}>
              Registrar contención
            </button>
          </form>

          {contencionRegistros.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '13px' }}>Sin registros en esta sesión.</p>
          ) : (
            <div className={styles.listWrap}>
              {contencionRegistros.map((r) => (
                <div key={r.id} className={styles.item}>
                  <div className={styles.itemTitle}>{r.tipo} — {r.paciente}</div>
                  <div className={styles.metaMini}>{r.timestamp} | Duración: {r.duracion || '-'}</div>
                  <div style={{ fontSize: '13px' }}>Personal: {r.personal || '-'} | Resultado: {r.resultado || '-'}</div>
                  {r.observaciones && <div style={{ fontSize: '12px', color: '#6b7280' }}>{r.observaciones}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Protocolos ── */}
      {activeTab === 'protocolo' && (
        <div>
          <h3 style={{ marginTop: 0 }}>Protocolos de referencia — Salud Mental</h3>
          <div className={styles.listWrap} style={{ maxHeight: '600px' }}>
            {PROTOCOLOS.map((proto, idx) => (
              <div key={proto.titulo} className={styles.item}>
                <button
                  type="button"
                  className={styles.linkBtn}
                  style={{ fontWeight: 700, fontSize: '14px', textAlign: 'left' }}
                  onClick={() => setProtocoloAbierto(protocoloAbierto === idx ? null : idx)}
                >
                  {protocoloAbierto === idx ? '▼' : '▶'} {proto.titulo}
                </button>
                {protocoloAbierto === idx && (
                  <ol style={{ margin: '8px 0 0 16px', padding: 0, display: 'grid', gap: '6px' }}>
                    {proto.pasos.map((paso) => (
                      <li key={paso} style={{ fontSize: '13px', color: '#1f2937' }}>{paso}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
