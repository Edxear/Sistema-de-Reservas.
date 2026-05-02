/**
 * Phase 8 – ShiftReport (Pase de Guardia)
 * Reusable component that generates a structured PDF-ready shift report
 * for any hospital area.
 *
 * Props:
 *   area     – string: area key ('guardia', 'salud-mental', 'enfermeria', etc.)
 *   areaLabel – string: human-readable label
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getBeds } from '../services/bedUnitService';
import { getIncidentes } from '../services/areaOperacionalService';
import styles from '../pages/operaciones/OperationalArea.module.css';

const TURNOS = [
  { key: 'manana', label: 'Manana (07:00 – 13:00)' },
  { key: 'tarde', label: 'Tarde (13:00 – 19:00)' },
  { key: 'noche', label: 'Noche (19:00 – 07:00)' },
];

function normalize(v = '') {
  return String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function sectorBelongsToArea(sector = '', areaKey = '') {
  const s = normalize(sector);
  const MAP = {
    'salud-mental': ['salud mental', 'psiquiatr', 'psico'],
    guardia: ['guardia', 'shock', 'triage', 'emerg', 'observacion'],
    mantenimiento: ['mantenimiento', 'infraestructura', 'ingenieria'],
    paramedicos: ['paramedic', 'ambulancia', 'prehospitalario'],
    enfermeria: [], // catch-all
  };
  const keywords = MAP[areaKey] || [];
  if (keywords.length === 0) {
    // enfermeria = everything except the specific areas
    return !['salud-mental', 'guardia', 'mantenimiento', 'paramedicos'].some((ak) =>
      (MAP[ak] || []).some((kw) => s.includes(kw))
    );
  }
  return keywords.some((kw) => s.includes(kw));
}

export default function ShiftReport({ area = 'enfermeria', areaLabel = 'Enfermeria' }) {
  const { user } = useAuth();
  const printRef = useRef(null);

  const [beds, setBeds] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [turno, setTurno] = useState('manana');
  const [notas, setNotas] = useState('');
  const [pendientes, setPendientes] = useState('');
  const [printed, setPrinted] = useState(false);

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bedsData, incData] = await Promise.all([
        getBeds(),
        getIncidentes({ area, estado: 'abierto', limit: 30 }),
      ]);
      const allBeds = Array.isArray(bedsData?.beds) ? bedsData.beds : [];
      setBeds(allBeds.filter((b) => sectorBelongsToArea(b.sector, area)));
      setIncidentes(Array.isArray(incData) ? incData : []);
    } catch (error) {
      toast.error('No se pudo cargar datos del informe de turno');
    } finally {
      setLoading(false);
    }
  }, [area]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const bedSummary = beds.reduce((acc, b) => {
    acc[b.estado] = (acc[b.estado] || 0) + 1;
    return acc;
  }, {});

  const handlePrint = () => {
    setPrinted(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const turnoLabel = TURNOS.find((t) => t.key === turno)?.label || turno;

  return (
    <div>
      {/* Controls – hidden on print */}
      <div className={styles.actionsRow} style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2c4f6f', marginBottom: 4 }}>
            Turno
          </label>
          <select
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            className={styles.select}
          >
            {TURNOS.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={loadData} className={styles.btnSecondary}>
          Actualizar datos
        </button>
        <button type="button" onClick={handlePrint} className={styles.btnPrimary}>
          Imprimir / Exportar PDF
        </button>
      </div>

      {/* Report body */}
      <div
        ref={printRef}
        style={{
          border: '1px solid #c5d8ec',
          borderRadius: 14,
          background: '#fff',
          padding: 20,
          display: 'grid',
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '2px solid #0f5f9e', paddingBottom: 12 }}>
          <h2 style={{ margin: '0 0 4px', color: '#0f3354', fontSize: 18 }}>
            Pase de Guardia – {areaLabel}
          </h2>
          <p style={{ margin: 0, color: '#3a5d7d', fontSize: 13 }}>
            {today} &nbsp;|&nbsp; Turno: {turnoLabel}
            &nbsp;|&nbsp; Confeccionado por: {user?.nombre || '—'} ({user?.rol || '—'})
          </p>
        </div>

        {/* Census */}
        <section>
          <h3 style={{ margin: '0 0 10px', color: '#113b60', fontSize: 14 }}>Censo de Camas del Area</h3>
          {loading ? (
            <p style={{ color: '#6b8099', fontSize: 13 }}>Cargando censo...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {[
                { label: 'Total', val: beds.length },
                { label: 'Ocupadas', val: bedSummary.ocupada || 0 },
                { label: 'Libres', val: bedSummary.libre || 0 },
                { label: 'Limpieza', val: bedSummary.limpieza || 0 },
                { label: 'Reservadas', val: bedSummary.reservada || 0 },
                { label: 'Aislamiento', val: bedSummary.aislamiento || 0 },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  style={{ border: '1px solid #dbe8f6', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}
                >
                  <p style={{ margin: '0 0 2px', fontSize: 11, color: '#5a7a99', fontWeight: 600 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f5f9e' }}>{val}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Open incidents */}
        <section>
          <h3 style={{ margin: '0 0 10px', color: '#113b60', fontSize: 14 }}>
            Incidentes Abiertos ({incidentes.length})
          </h3>
          {loading ? (
            <p style={{ color: '#6b8099', fontSize: 13 }}>Cargando incidentes...</p>
          ) : incidentes.length === 0 ? (
            <p style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>Sin incidentes abiertos en el area.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table} style={{ minWidth: 400 }}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Titulo</th>
                    <th>Estado</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentes.map((inc) => (
                    <tr key={inc._id}>
                      <td>
                        <span style={{
                          background: inc.tipo === 'critico' ? '#fee2e2' : inc.tipo === 'medio' ? '#fef3c7' : '#f0fdf4',
                          color: inc.tipo === 'critico' ? '#991b1b' : inc.tipo === 'medio' ? '#78350f' : '#166534',
                          padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        }}>
                          {inc.tipo}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{inc.titulo}</td>
                      <td style={{ fontSize: 12 }}>{inc.estado}</td>
                      <td style={{ fontSize: 12, color: '#5a7a99' }}>{inc.accion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Notes & pending */}
        <section style={{ display: 'grid', gap: 12 }}>
          <div>
            <h3 style={{ margin: '0 0 6px', color: '#113b60', fontSize: 14 }}>Notas del Turno</h3>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              placeholder="Registrar observaciones generales del turno..."
              style={{
                width: '100%', border: '1px solid #c5d8ec', borderRadius: 8,
                padding: '8px 10px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', color: '#113b60', fontSize: 14 }}>Pendientes para el Turno Siguiente</h3>
            <textarea
              value={pendientes}
              onChange={(e) => setPendientes(e.target.value)}
              rows={3}
              placeholder="Listar tareas o seguimientos que quedan pendientes..."
              style={{
                width: '100%', border: '1px solid #c5d8ec', borderRadius: 8,
                padding: '8px 10px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </section>

        {/* Signature area */}
        <div style={{ display: 'flex', gap: 24, marginTop: 8, flexWrap: 'wrap' }}>
          {['Firma Saliente', 'Firma Entrante', 'Supervisor / Jefa de Area'].map((label) => (
            <div key={label} style={{ flex: '1 1 160px', borderTop: '1px solid #8aaccc', paddingTop: 6 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#5a7a99', textAlign: 'center' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
