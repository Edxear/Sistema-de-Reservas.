import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { getBeds, updateBed } from '../services/bedUnitService';
import { useAuth } from '../context/AuthContext';
import styles from '../pages/enfermeria/Enfermeria.module.css';

const ESTADOS = ['libre', 'ocupada', 'reservada', 'limpieza', 'mantenimiento', 'aislamiento'];

const ESTADO_LABEL = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  limpieza: 'Limpieza',
  mantenimiento: 'Mantenimiento',
  aislamiento: 'Aislamiento',
};

const normalize = (value = '') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const isMentalSector = (sector = '') => {
  const s = normalize(sector);
  return s.includes('salud mental') || s.includes('psiquiatr') || s.includes('neuropsiq') || s.includes('psico');
};

const isGuardSector = (sector = '') => {
  const s = normalize(sector);
  return s.includes('guardia') || s.includes('shock') || s.includes('triage') || s.includes('emerg') || s.includes('observacion');
};

const canEdit = (role) => ['enfermero', 'admin', 'superadmin'].includes(String(role || '').toLowerCase());

const getAreaConfig = (areaKey) => {
  if (areaKey === 'salud-mental') {
    return {
      label: 'Salud Mental',
      description: 'Camas sectoriales de internacion psiquiatrica / salud mental.',
      matches: (sector) => isMentalSector(sector),
    };
  }

  if (areaKey === 'guardia-medica') {
    return {
      label: 'Guardia Medica',
      description: 'Camas de observacion, triage y sectores criticos de urgencias.',
      matches: (sector) => isGuardSector(sector),
    };
  }

  return {
    label: 'Enfermeria',
    description: 'Camas sectoriales operativas de Enfermeria (excluye Salud Mental y Guardia).',
    matches: (sector) => !isMentalSector(sector) && !isGuardSector(sector),
  };
};

export default function AreaBedBoard({ areaKey = 'enfermeria' }) {
  const { user } = useAuth();
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sectorFilter, setSectorFilter] = useState('');
  const [savingId, setSavingId] = useState('');

  const config = getAreaConfig(areaKey);

  const loadBeds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBeds();
      const items = Array.isArray(data?.beds) ? data.beds : [];
      const filtered = items.filter((bed) => config.matches(bed.sector || ''));
      setBeds(filtered);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar pizarra de camas del area');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadBeds();
  }, [loadBeds]);

  const sectors = useMemo(() => [...new Set(beds.map((b) => b.sector).filter(Boolean))].sort(), [beds]);

  const visibleBeds = useMemo(
    () => (sectorFilter ? beds.filter((b) => b.sector === sectorFilter) : beds),
    [beds, sectorFilter],
  );

  const metrics = useMemo(() => {
    return visibleBeds.reduce((acc, bed) => {
      acc.total += 1;
      acc.byEstado[bed.estado] = (acc.byEstado[bed.estado] || 0) + 1;
      return acc;
    }, { total: 0, byEstado: {} });
  }, [visibleBeds]);

  const groupedBySector = useMemo(() => {
    return visibleBeds.reduce((acc, bed) => {
      const key = bed.sector || 'Sin sector';
      acc[key] = acc[key] || [];
      acc[key].push(bed);
      return acc;
    }, {});
  }, [visibleBeds]);

  const handleEstadoChange = async (bed, estado) => {
    if (!canEdit(user?.rol)) return;
    setSavingId(String(bed._id));
    try {
      await updateBed(bed._id, { estado });
      await loadBeds();
      toast.success(`Cama ${bed.codigo} actualizada a ${ESTADO_LABEL[estado] || estado}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar estado de cama');
    } finally {
      setSavingId('');
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.actionsRow}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Pizarra de Camas - {config.label}</h2>
          <p style={{ margin: 0, color: '#4f6982', fontSize: 13 }}>{config.description}</p>
        </div>
        <button className={styles.pill} type="button" onClick={loadBeds} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className={styles.filterRow}>
        <label className={styles.filterLabel} htmlFor={`sector-${areaKey}`}>Filtrar por sector</label>
        <select
          id={`sector-${areaKey}`}
          className={styles.select}
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
        >
          <option value="">Todos</option>
          {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
        </select>
      </div>

      <div className={styles.gridMini}>
        <article className={styles.miniCard}><strong>Total</strong><p>{metrics.total}</p></article>
        {ESTADOS.map((estado) => (
          <article key={estado} className={styles.miniCard}>
            <strong>{ESTADO_LABEL[estado]}</strong>
            <p>{metrics.byEstado[estado] || 0}</p>
          </article>
        ))}
      </div>

      {Object.keys(groupedBySector).length === 0 ? (
        <p style={{ marginTop: 12 }}>No hay camas registradas para esta area.</p>
      ) : Object.entries(groupedBySector).map(([sector, sectorBeds]) => (
        <div key={sector} style={{ marginTop: 14 }}>
          <h3 style={{ margin: '6px 0', color: '#154870' }}>{sector}</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cama</th>
                  <th>Estado</th>
                  <th>Paciente</th>
                  <th>Documento</th>
                  <th>Observaciones</th>
                  <th>Actualizado por</th>
                </tr>
              </thead>
              <tbody>
                {sectorBeds.map((bed) => (
                  <tr key={bed._id}>
                    <td>{bed.codigo}</td>
                    <td>
                      <select
                        className={styles.select}
                        style={{ minWidth: 160, marginBottom: 0 }}
                        disabled={!canEdit(user?.rol) || savingId === String(bed._id)}
                        value={bed.estado}
                        onChange={(e) => handleEstadoChange(bed, e.target.value)}
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>{ESTADO_LABEL[estado]}</option>
                        ))}
                      </select>
                    </td>
                    <td>{bed.paciente?.nombre || '-'}</td>
                    <td>{bed.paciente?.documento || '-'}</td>
                    <td>{bed.observaciones || '-'}</td>
                    <td>{bed.updatedBy?.nombre || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
