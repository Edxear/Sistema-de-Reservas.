/**
 * Phase 7 – Operational Dashboard
 * Cross-area metrics and status overview for admins and clinical staff.
 * Shows live bed census, open incidents per area, and area statuses.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getBeds } from '../../services/bedUnitService';
import { getIncidentes } from '../../services/areaOperacionalService';
import { SkeletonKpiGrid, SkeletonTable } from '../../components/SkeletonLoader';
import styles from './OperationalArea.module.css';

const AREAS = [
  { key: 'guardia', label: 'Guardia Medica', path: '/guardia-medica', accent: '#ef4444' },
  { key: 'salud-mental', label: 'Salud Mental', path: '/salud-mental', accent: '#7c3aed' },
  { key: 'mantenimiento', label: 'Mantenimiento', path: '/mantenimiento', accent: '#f97316' },
  { key: 'paramedicos', label: 'Paramedicos', path: '/paramedicos-ambulancia', accent: '#0891b2' },
  { key: 'enfermeria', label: 'Enfermeria', path: '/enfermeria', accent: '#0ea5e9' },
];

function normalize(v = '') {
  return String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function sectorToArea(sector = '') {
  const s = normalize(sector);
  if (s.includes('salud mental') || s.includes('psiquiatr') || s.includes('psico')) return 'salud-mental';
  if (s.includes('guardia') || s.includes('shock') || s.includes('triage') || s.includes('emerg') || s.includes('observacion')) return 'guardia';
  if (s.includes('mantenimiento') || s.includes('infraestructura') || s.includes('ingenieria')) return 'mantenimiento';
  if (s.includes('paramedic') || s.includes('ambulancia') || s.includes('prehospitalario')) return 'paramedicos';
  return 'enfermeria';
}

export default function OperationalDashboard() {
  const [beds, setBeds] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bedsData, incData] = await Promise.all([
        getBeds(),
        getIncidentes({ estado: 'abierto', limit: 100 }),
      ]);
      setBeds(Array.isArray(bedsData?.beds) ? bedsData.beds : []);
      setIncidentes(Array.isArray(incData) ? incData : []);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error('No se pudo cargar el dashboard operacional');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [loadData]);

  const bedMetrics = useMemo(() => {
    const total = beds.length;
    const byEstado = beds.reduce((acc, b) => {
      acc[b.estado] = (acc[b.estado] || 0) + 1;
      return acc;
    }, {});
    const ocupacion = total > 0 ? Math.round(((byEstado.ocupada || 0) / total) * 100) : 0;
    return { total, ...byEstado, ocupacion };
  }, [beds]);

  const areaStats = useMemo(() => {
    return AREAS.map((area) => {
      const areaBeds = beds.filter((b) => sectorToArea(b.sector) === area.key);
      const openIncidents = incidentes.filter((i) => i.area === area.key);
      const criticos = openIncidents.filter((i) => i.tipo === 'critico').length;
      const totalBeds = areaBeds.length;
      const ocupadas = areaBeds.filter((b) => b.estado === 'ocupada').length;
      const libres = areaBeds.filter((b) => b.estado === 'libre').length;
      const status = criticos > 0 ? 'critico' : openIncidents.length > 2 ? 'alerta' : 'normal';
      return { ...area, totalBeds, ocupadas, libres, openIncidents: openIncidents.length, criticos, status };
    });
  }, [beds, incidentes]);

  const globalMetrics = useMemo(() => ({
    totalCamas: bedMetrics.total,
    ocupacion: bedMetrics.ocupacion,
    camasLibres: bedMetrics.libre || 0,
    incidentesAbiertos: incidentes.length,
    incidentesCriticos: incidentes.filter((i) => i.tipo === 'critico').length,
  }), [bedMetrics, incidentes]);

  const STATUS_STYLE = {
    critico: { background: '#fef2f2', border: '#fca5a5', badge: '#ef4444', label: 'CRITICO' },
    alerta: { background: '#fffbeb', border: '#fcd34d', badge: '#f59e0b', label: 'ALERTA' },
    normal: { background: '#f0fdf4', border: '#86efac', badge: '#22c55e', label: 'NORMAL' },
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1>Dashboard Operacional</h1>
        <p>Vision consolidada de todas las areas clinicas y operativas del establecimiento.</p>
        <div className={styles.metaRow}>
          <span className={styles.metaTag}>
            {lastUpdated ? `Actualizado: ${lastUpdated.toLocaleTimeString('es-AR')}` : 'Cargando...'}
          </span>
          <span className={styles.metaTag}>Ocupacion global: {globalMetrics.ocupacion}%</span>
          <span className={styles.metaTag}>Incidentes abiertos: {globalMetrics.incidentesAbiertos}</span>
          <button
            type="button"
            onClick={loadData}
            style={{
              border: '1px solid #c8dbf0', borderRadius: 999, background: '#f4f9ff',
              color: '#18466d', padding: '6px 14px', fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Actualizar
          </button>
        </div>
      </section>

      {/* Global KPIs */}
      {loading ? (
        <SkeletonKpiGrid cards={5} />
      ) : (
        <div className={styles.grid3} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {[
            { label: 'Total Camas', value: globalMetrics.totalCamas, color: '#0f5f9e' },
            { label: 'Camas Ocupadas', value: bedMetrics.ocupada || 0, color: '#1d4ed8' },
            { label: 'Camas Libres', value: globalMetrics.camasLibres, color: '#16a34a' },
            { label: 'Ocupacion', value: `${globalMetrics.ocupacion}%`, color: globalMetrics.ocupacion > 85 ? '#ef4444' : '#0f5f9e' },
            { label: 'Incidentes Abiertos', value: globalMetrics.incidentesAbiertos, color: globalMetrics.incidentesCriticos > 0 ? '#ef4444' : '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} className={styles.panelCard}>
              <p style={{ margin: 0, fontSize: 12, color: '#5a7a99', fontWeight: 600 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Per-area cards */}
      <div className={styles.card}>
        <h2 style={{ margin: '0 0 14px', color: '#113b60', fontSize: 16 }}>Estado por Area</h2>
        {loading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {areaStats.map((area) => {
              const s = STATUS_STYLE[area.status];
              return (
                <div
                  key={area.key}
                  style={{
                    border: `1px solid ${s.border}`,
                    borderRadius: 12,
                    background: s.background,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: area.accent, flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 700, color: '#0f3354', minWidth: 150, fontSize: 14 }}>
                    {area.label}
                  </span>
                  <span style={{ fontSize: 12, color: '#3a5d7d' }}>
                    Camas: {area.totalBeds} &nbsp;|&nbsp; Ocupadas: {area.ocupadas} &nbsp;|&nbsp; Libres: {area.libres}
                  </span>
                  <span style={{ fontSize: 12, color: '#3a5d7d' }}>
                    Incidentes: {area.openIncidents}
                    {area.criticos > 0 && (
                      <strong style={{ color: '#ef4444', marginLeft: 4 }}>({area.criticos} criticos)</strong>
                    )}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: s.badge,
                      color: '#fff',
                      borderRadius: 999,
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {s.label}
                  </span>
                  <Link
                    to={area.path}
                    style={{
                      border: '1px solid #c8dbf0', borderRadius: 8, background: '#fff',
                      color: '#18466d', padding: '4px 10px', fontSize: 12, fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Ir al area
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent critical incidents */}
      <div className={styles.card}>
        <h2 style={{ margin: '0 0 14px', color: '#113b60', fontSize: 16 }}>Incidentes Criticos Abiertos</h2>
        {loading ? (
          <SkeletonTable rows={3} cols={4} />
        ) : (
          (() => {
            const criticos = incidentes.filter((i) => i.tipo === 'critico');
            if (criticos.length === 0) {
              return (
                <p style={{ color: '#16a34a', fontWeight: 600, margin: 0 }}>
                  Sin incidentes criticos activos
                </p>
              );
            }
            return (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>Titulo</th>
                      <th>Estado</th>
                      <th>Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticos.slice(0, 10).map((inc) => (
                      <tr key={inc._id}>
                        <td>{AREAS.find((a) => a.key === inc.area)?.label || inc.area}</td>
                        <td>{inc.titulo}</td>
                        <td>
                          <span style={{
                            background: inc.estado === 'en-proceso' ? '#fef3c7' : '#fee2e2',
                            color: inc.estado === 'en-proceso' ? '#92400e' : '#991b1b',
                            padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                          }}>
                            {inc.estado}
                          </span>
                        </td>
                        <td>{new Date(inc.createdAt).toLocaleDateString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
