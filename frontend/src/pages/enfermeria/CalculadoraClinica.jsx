import React, { useState } from 'react';
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

// Calculadoras clínicas disponibles
const CALCULADORAS = {
  glasgow: {
    nombre: 'Escala de Glasgow',
    descripcion: 'Evalúa el nivel de conciencia del paciente (puntuación de 3 a 15).',
    icono: '🧠',
    color: '#dbeafe',
  },
  braden: {
    nombre: 'Escala de Braden',
    descripcion: 'Predice el riesgo de úlceras por presión (< 14 = riesgo).',
    icono: '🛏️',
    color: '#d1fae5',
  },
  imc: {
    nombre: 'IMC / Índice de Masa Corporal',
    descripcion: 'Calcula el IMC y la categoría nutricional del paciente.',
    icono: '⚖️',
    color: '#fef3c7',
  },
  infusion: {
    nombre: 'Goteo IV / Bombas de infusión',
    descripcion: 'Calcula el ritmo de goteo (gotas/min o ml/h) de sueros y medicamentos.',
    icono: '💉',
    color: '#ede9fe',
  },
  dosis: {
    nombre: 'Calculadora de dosis por kg',
    descripcion: 'Calcula la dosis de un medicamento según el peso del paciente.',
    icono: '💊',
    color: '#fee2e2',
  },
  diuresis: {
    nombre: 'Diuresis horaria',
    descripcion: 'Calcula el balance hídrico y alerta si la diuresis es insuficiente.',
    icono: '🧪',
    color: '#e0f2fe',
  },
};

// ─────── Glasgow ───────
function GlasgowCalc() {
  const [apertura, setApertura] = useState(4);
  const [verbal, setVerbal] = useState(5);
  const [motora, setMotora] = useState(6);

  const total = apertura + verbal + motora;
  const nivel =
    total === 15 ? { texto: 'Normal', color: '#10b981' }
    : total >= 13 ? { texto: 'Lesión leve', color: '#f59e0b' }
    : total >= 9  ? { texto: 'Lesión moderada', color: '#f97316' }
    :               { texto: 'Lesión grave / coma', color: '#ef4444' };

  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>🧠 Escala de Glasgow</h4>

      {[
        { label: 'Apertura ocular', val: apertura, set: setApertura, max: 4,
          opciones: ['4 – Espontánea', '3 – A la voz', '2 – Al dolor', '1 – No abre'] },
        { label: 'Respuesta verbal', val: verbal, set: setVerbal, max: 5,
          opciones: ['5 – Orientado', '4 – Confuso', '3 – Palabras inapropiadas', '2 – Sonidos incomprensibles', '1 – Sin respuesta'] },
        { label: 'Respuesta motora', val: motora, set: setMotora, max: 6,
          opciones: ['6 – Obedece órdenes', '5 – Localiza dolor', '4 – Retirada', '3 – Flexión', '2 – Extensión', '1 – Sin respuesta'] },
      ].map(({ label, val, set, opciones }) => (
        <div key={label} style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>{label}: <strong>{val}</strong> pts</label>
          <select
            className={styles.select}
            value={val}
            onChange={(e) => set(Number(e.target.value))}
            style={{ width: '100%' }}
          >
            {opciones.map((op, i) => (
              <option key={i} value={opciones.length - i}>{op}</option>
            ))}
          </select>
        </div>
      ))}

      <div style={{ marginTop: '1rem', padding: '1.25rem', backgroundColor: nivel.color + '22', borderRadius: '8px', border: `2px solid ${nivel.color}`, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: nivel.color }}>{total} / 15</div>
        <div style={{ fontWeight: '600', marginTop: '0.25rem', color: nivel.color }}>{nivel.texto}</div>
        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
          Ocular: {apertura} · Verbal: {verbal} · Motora: {motora}
        </div>
        {total <= 8 && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#dc2626', fontWeight: '600' }}>
            ⚠ Glasgow ≤ 8 → Vía aérea comprometida. Valorar intubación urgente. Avisar médico.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────── Braden ───────
function BradenCalc() {
  const categorias = [
    { label: 'Percepción sensorial', opciones: ['1 – Completamente limitada', '2 – Muy limitada', '3 – Levemente limitada', '4 – Sin limitación'] },
    { label: 'Exposición a la humedad', opciones: ['1 – Constantemente húmeda', '2 – Muy húmeda', '3 – Ocasionalmente húmeda', '4 – Raramente húmeda'] },
    { label: 'Actividad física', opciones: ['1 – En cama', '2 – En sillón', '3 – Camina ocasionalmente', '4 – Camina frecuentemente'] },
    { label: 'Movilidad', opciones: ['1 – Completamente inmóvil', '2 – Muy limitada', '3 – Levemente limitada', '4 – Sin limitación'] },
    { label: 'Nutrición', opciones: ['1 – Muy pobre', '2 – Inadecuada', '3 – Adecuada', '4 – Excelente'] },
    { label: 'Fricción y cizallamiento', opciones: ['1 – Problem present', '2 – Potential problem', '3 – No apparent problem'] },
  ];

  const [valores, setValores] = useState(categorias.map((c) => parseInt(c.opciones[c.opciones.length - 1][0])));

  const total = valores.reduce((a, b) => a + b, 0);
  const riesgo =
    total >= 19 ? { texto: 'Sin riesgo', color: '#10b981' }
    : total >= 15 ? { texto: 'Riesgo leve', color: '#f59e0b' }
    : total >= 13 ? { texto: 'Riesgo moderado', color: '#f97316' }
    :               { texto: 'Riesgo alto / muy alto', color: '#ef4444' };

  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>🛏️ Escala de Braden (riesgo UPP)</h4>
      {categorias.map((cat, i) => (
        <div key={i} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>{cat.label}: <strong>{valores[i]}</strong></label>
          <select
            className={styles.select}
            value={valores[i]}
            onChange={(e) => setValores((prev) => { const n = [...prev]; n[i] = Number(e.target.value); return n; })}
            style={{ width: '100%' }}
          >
            {cat.opciones.map((op, j) => (
              <option key={j} value={parseInt(op[0])}>{op}</option>
            ))}
          </select>
        </div>
      ))}
      <div style={{ marginTop: '1rem', padding: '1.25rem', backgroundColor: riesgo.color + '22', borderRadius: '8px', border: `2px solid ${riesgo.color}`, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: riesgo.color }}>{total} / 23</div>
        <div style={{ fontWeight: '600', color: riesgo.color }}>{riesgo.texto}</div>
        {total < 14 && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#dc2626', fontWeight: '600' }}>
            ⚠ Braden &lt; 14 → Iniciar protocolo anti-escaras. Colchón + cambios posturales cada 2h.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────── IMC ───────
function ImcCalc() {
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');

  const imc = peso && talla ? (parseFloat(peso) / (parseFloat(talla) / 100) ** 2).toFixed(1) : null;
  const categoria =
    !imc ? null
    : imc < 18.5 ? { texto: 'Bajo peso', color: '#f59e0b' }
    : imc < 25   ? { texto: 'Peso normal', color: '#10b981' }
    : imc < 30   ? { texto: 'Sobrepeso', color: '#f97316' }
    :               { texto: 'Obesidad', color: '#ef4444' };

  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>⚖️ IMC – Índice de Masa Corporal</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Peso (kg)</label>
          <input type="number" className={styles.select} value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ej: 72" min="1" max="300" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Talla (cm)</label>
          <input type="number" className={styles.select} value={talla} onChange={(e) => setTalla(e.target.value)} placeholder="Ej: 170" min="50" max="250" style={{ width: '100%' }} />
        </div>
      </div>
      {imc && categoria && (
        <div style={{ padding: '1.25rem', backgroundColor: categoria.color + '22', borderRadius: '8px', border: `2px solid ${categoria.color}`, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: categoria.color }}>{imc}</div>
          <div style={{ fontWeight: '600', color: categoria.color }}>{categoria.texto}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>Peso saludable estimado: {((18.5 * (parseFloat(talla)/100)**2).toFixed(0))} – {((24.9 * (parseFloat(talla)/100)**2).toFixed(0))} kg</div>
        </div>
      )}
    </div>
  );
}

// ─────── Goteo IV ───────
function GoteoCalc() {
  const [volumen, setVolumen] = useState('');
  const [tiempo, setTiempo] = useState('');
  const [unidadTiempo, setUnidadTiempo] = useState('horas');
  const [factorGoteo, setFactorGoteo] = useState(20); // gotas/mL (adultos: 20)

  const tiempoHoras = unidadTiempo === 'horas' ? parseFloat(tiempo) : parseFloat(tiempo) / 60;
  const mlPorHora = volumen && tiempo ? (parseFloat(volumen) / tiempoHoras).toFixed(1) : null;
  const gotasPorMin = mlPorHora ? ((mlPorHora * factorGoteo) / 60).toFixed(0) : null;

  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>💉 Calculadora de Goteo IV</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Volumen total (mL)</label>
          <input type="number" className={styles.select} value={volumen} onChange={(e) => setVolumen(e.target.value)} placeholder="Ej: 500" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Tiempo</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input type="number" className={styles.select} value={tiempo} onChange={(e) => setTiempo(e.target.value)} placeholder="Ej: 8" style={{ flex: 1 }} />
            <select className={styles.select} value={unidadTiempo} onChange={(e) => setUnidadTiempo(e.target.value)}>
              <option value="horas">horas</option>
              <option value="minutos">minutos</option>
            </select>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Factor de goteo</label>
        <select className={styles.select} value={factorGoteo} onChange={(e) => setFactorGoteo(Number(e.target.value))} style={{ width: '100%' }}>
          <option value={20}>20 gotas/mL (adultos - macrogotero)</option>
          <option value={60}>60 gotas/mL (pediátrico - microgotero)</option>
          <option value={15}>15 gotas/mL (sangre)</option>
        </select>
      </div>
      {mlPorHora && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: '#dbeafe', borderRadius: '8px', border: '2px solid #3b82f6', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1d4ed8' }}>{mlPorHora}</div>
            <div style={{ fontWeight: '600', color: '#1d4ed8' }}>mL / hora</div>
          </div>
          <div style={{ padding: '1.25rem', backgroundColor: '#d1fae5', borderRadius: '8px', border: '2px solid #10b981', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#047857' }}>{gotasPorMin}</div>
            <div style={{ fontWeight: '600', color: '#047857' }}>gotas / minuto</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────── Dosis por kg ───────
function DosisCalc() {
  const [peso, setPeso] = useState('');
  const [dosisKg, setDosisKg] = useState('');
  const [frecuencia, setFrecuencia] = useState('8');
  const [concentracion, setConcentracion] = useState('');
  const [volumenAmpolla, setVolumenAmpolla] = useState('');

  const dosisTotal = peso && dosisKg ? (parseFloat(peso) * parseFloat(dosisKg)).toFixed(2) : null;
  const dosisHora = dosisTotal && frecuencia ? (parseFloat(dosisTotal) / (24 / parseFloat(frecuencia))).toFixed(2) : null;
  const volumenAAdministrar = dosisTotal && concentracion && volumenAmpolla
    ? ((parseFloat(dosisTotal) / parseFloat(concentracion)) * parseFloat(volumenAmpolla)).toFixed(2)
    : null;

  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>💊 Dosis por peso (mg/kg)</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Peso del paciente (kg)</label>
          <input type="number" className={styles.select} value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ej: 68" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Dosis prescrita (mg/kg)</label>
          <input type="number" className={styles.select} value={dosisKg} onChange={(e) => setDosisKg(e.target.value)} placeholder="Ej: 10" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Cada cuántas horas</label>
          <select className={styles.select} value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} style={{ width: '100%' }}>
            {['4','6','8','12','24'].map((h) => <option key={h} value={h}>cada {h}h</option>)}
          </select>
        </div>
      </div>

      {dosisTotal && (
        <div style={{ padding: '1rem', backgroundColor: '#dbeafe', borderRadius: '8px', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1d4ed8' }}>Dosis única: <strong>{dosisTotal} mg</strong></div>
          {dosisHora && <div style={{ color: '#1e40af' }}>Dosis por frecuencia: {dosisTotal} mg cada {frecuencia}h</div>}
        </div>
      )}

      {/* Cálculo opcional de volumen a extraer */}
      <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px dashed #d1d5db' }}>
        <h5 style={{ marginBottom: '0.75rem', color: '#6b7280' }}>Opcional: ¿cuánto extraer de la ampolla?</h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Concentración de ampolla (mg)</label>
            <input type="number" className={styles.select} value={concentracion} onChange={(e) => setConcentracion(e.target.value)} placeholder="Ej: 500" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Volumen de ampolla (mL)</label>
            <input type="number" className={styles.select} value={volumenAmpolla} onChange={(e) => setVolumenAmpolla(e.target.value)} placeholder="Ej: 5" style={{ width: '100%' }} />
          </div>
        </div>
        {volumenAAdministrar && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#d1fae5', borderRadius: '6px', fontWeight: '700', color: '#047857', fontSize: '1.1rem' }}>
            Extraer: {volumenAAdministrar} mL de la ampolla
          </div>
        )}
      </div>
    </div>
  );
}

// ─────── Diuresis ───────
function DiuresisCalc() {
  const [ingesta, setIngesta] = useState('');
  const [diuresis, setDiuresis] = useState('');
  const [horasTurno, setHorasTurno] = useState('8');
  const [peso, setPeso] = useState('');

  const balance = ingesta && diuresis ? (parseFloat(ingesta) - parseFloat(diuresis)).toFixed(0) : null;
  const diuresisHoraria = diuresis && horasTurno ? (parseFloat(diuresis) / parseFloat(horasTurno)).toFixed(1) : null;
  const diuresisKgH = diuresisHoraria && peso ? (parseFloat(diuresisHoraria) / parseFloat(peso)).toFixed(2) : null;
  const alertaDiuresis = diuresisKgH ? parseFloat(diuresisKgH) < 0.5 : (diuresisHoraria ? parseFloat(diuresisHoraria) < 30 : false);

  return (
    <div>
      <h4 style={{ marginBottom: '1rem' }}>🧪 Balance hídrico y diuresis horaria</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Ingesta total del turno (mL)</label>
          <input type="number" className={styles.select} value={ingesta} onChange={(e) => setIngesta(e.target.value)} placeholder="Ej: 1200" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Diuresis total del turno (mL)</label>
          <input type="number" className={styles.select} value={diuresis} onChange={(e) => setDiuresis(e.target.value)} placeholder="Ej: 800" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Duración del turno (horas)</label>
          <select className={styles.select} value={horasTurno} onChange={(e) => setHorasTurno(e.target.value)} style={{ width: '100%' }}>
            <option value="6">6 horas</option>
            <option value="8">8 horas</option>
            <option value="12">12 horas</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Peso del paciente (kg, opcional)</label>
          <input type="number" className={styles.select} value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Para calcular ml/kg/h" style={{ width: '100%' }} />
        </div>
      </div>

      {balance !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: parseFloat(balance) >= 0 ? '#d1fae5' : '#fee2e2', borderRadius: '8px', border: `2px solid ${parseFloat(balance) >= 0 ? '#10b981' : '#ef4444'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: parseFloat(balance) >= 0 ? '#047857' : '#dc2626' }}>
              {parseFloat(balance) >= 0 ? '+' : ''}{balance} mL
            </div>
            <div style={{ fontWeight: '600', color: parseFloat(balance) >= 0 ? '#047857' : '#dc2626' }}>Balance hídrico</div>
          </div>
          {diuresisHoraria && (
            <div style={{ padding: '1rem', backgroundColor: alertaDiuresis ? '#fee2e2' : '#dbeafe', borderRadius: '8px', border: `2px solid ${alertaDiuresis ? '#ef4444' : '#3b82f6'}`, textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: alertaDiuresis ? '#dc2626' : '#1d4ed8' }}>{diuresisHoraria} mL/h</div>
              <div style={{ fontWeight: '600', color: alertaDiuresis ? '#dc2626' : '#1d4ed8' }}>Diuresis horaria</div>
              {alertaDiuresis && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>⚠ Por debajo del mínimo (30 mL/h)</div>}
            </div>
          )}
          {diuresisKgH && (
            <div style={{ padding: '1rem', backgroundColor: parseFloat(diuresisKgH) < 0.5 ? '#fee2e2' : '#d1fae5', borderRadius: '8px', border: `2px solid ${parseFloat(diuresisKgH) < 0.5 ? '#ef4444' : '#10b981'}`, textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: parseFloat(diuresisKgH) < 0.5 ? '#dc2626' : '#047857' }}>{diuresisKgH}</div>
              <div style={{ fontWeight: '600', color: parseFloat(diuresisKgH) < 0.5 ? '#dc2626' : '#047857' }}>mL/kg/hora</div>
              {parseFloat(diuresisKgH) < 0.5 && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>⚠ Oliguria - avisar médico</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────── Componente Principal ───────
export default function CalculadoraClinica() {
  const [calcActiva, setCalcActiva] = useState(null);

  return (
    <div>
      {/* HEADER */}
      <section className={styles.card} style={{ borderLeft: '4px solid #8b5cf6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>🔢 Calculadora Clínica</h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Herramientas de cálculo rápido para el trabajo diario de enfermería. Sin internet, siempre disponibles.
            </p>
          </div>
          <InfoBtn texto={'Calculadora Clínica:\n\nEstas herramientas te ayudan a calcular rápidamente:\n• Escalas clínicas (Glasgow, Braden)\n• Dosis de medicamentos por peso\n• Ritmo de goteo de sueros\n• Balance hídrico del paciente\n• IMC y estado nutricional\n\nLos resultados son orientativos. Siempre confirma con el médico o el protocolo del servicio.'} />
        </div>
      </section>

      {/* GRID DE CALCULADORAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {Object.entries(CALCULADORAS).map(([clave, calc]) => (
          <button
            key={clave}
            type="button"
            onClick={() => setCalcActiva(calcActiva === clave ? null : clave)}
            style={{
              padding: '1.25rem',
              backgroundColor: calcActiva === clave ? calc.color : '#fff',
              border: calcActiva === clave ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: calcActiva === clave ? '0 0 0 3px #ddd6fe' : '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '2rem' }}>{calc.icono}</div>
            <div style={{ fontWeight: '700', marginTop: '0.4rem', fontSize: '0.9rem' }}>{calc.nombre}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.25rem' }}>{calc.descripcion}</div>
          </button>
        ))}
      </div>

      {/* CALCULADORA ACTIVA */}
      {calcActiva && (
        <section className={styles.card} style={{ marginTop: '1rem', borderLeft: '4px solid #8b5cf6' }}>
          <div>
            {calcActiva === 'glasgow'  && <GlasgowCalc />}
            {calcActiva === 'braden'   && <BradenCalc />}
            {calcActiva === 'imc'      && <ImcCalc />}
            {calcActiva === 'infusion' && <GoteoCalc />}
            {calcActiva === 'dosis'    && <DosisCalc />}
            {calcActiva === 'diuresis' && <DiuresisCalc />}
          </div>
        </section>
      )}

      {!calcActiva && (
        <p style={{ marginTop: '1rem', color: '#9ca3af', textAlign: 'center', fontSize: '0.9rem' }}>
          Selecciona una calculadora arriba para empezar.
        </p>
      )}
    </div>
  );
}
