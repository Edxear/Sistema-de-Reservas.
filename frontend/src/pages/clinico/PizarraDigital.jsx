import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getBeds, createBed, updateBed } from '../../services/bedUnitService';
import { exportArrayToExcel } from '../../utils/excelExport';
import styles from './Clinical.module.css';

const ESTADOS = ['libre', 'ocupada', 'reservada', 'limpieza', 'mantenimiento', 'aislamiento'];

const ESTADO_CFG = {
  libre:         { bg: '#d1fae5', borde: '#10b981', texto: '#065f46', label: 'Libre',          icono: '🟢' },
  ocupada:       { bg: '#dbeafe', borde: '#3b82f6', texto: '#1e3a8a', label: 'Ocupada',        icono: '🔵' },
  reservada:     { bg: '#ede9fe', borde: '#7c3aed', texto: '#4c1d95', label: 'Reservada',      icono: '🟣' },
  limpieza:      { bg: '#fef9c3', borde: '#f59e0b', texto: '#92400e', label: 'Limpieza',       icono: '🟡' },
  mantenimiento: { bg: '#ffedd5', borde: '#f97316', texto: '#7c2d12', label: 'Mantenimiento',  icono: '🟠' },
  aislamiento:   { bg: '#fee2e2', borde: '#ef4444', texto: '#7f1d1d', label: 'Aislamiento',    icono: '🔴' },
};

const canEdit = (role) => ['enfermero', 'admin', 'superadmin'].includes(String(role || '').toLowerCase());
const canCreate = (role) => ['admin', 'superadmin', 'enfermero'].includes(String(role || '').toLowerCase());

const initialForm = { codigo: '', sector: '', estado: 'libre', observaciones: '' };

export default function PizarraDigital() {
  const { user } = useAuth();
  const role = user?.rol;

  const [beds, setBeds] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, byEstado: {} });
  const [loading, setLoading] = useState(false);
  const [sectorFilter, setSectorFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(initialForm);
  const [savingNew, setSavingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ estado: '', observaciones: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBeds();
      setBeds(Array.isArray(data?.beds) ? data.beds : []);
      setMetrics(data?.metrics || { total: 0, byEstado: {} });
      setUltimaActualizacion(new Date());
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cargar el censo de camas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleExportExcel = () => {
    const rows = beds.map((b) => ({
      Codigo: b.codigo || '',
      Sector: b.sector || '',
      Estado: ESTADO_CFG[b.estado]?.label || b.estado || '',
      Paciente: b.paciente?.nombre || '',
      Observaciones: b.observaciones || '',
    }));
    exportArrayToExcel({ rows, sheetName: 'CensoCamas', fileName: 'censo_camas.xlsx' });
  };

  const sectores = [...new Set(beds.map((b) => b.sector).filter(Boolean))].sort();
  const bedsVisible = sectorFilter ? beds.filter((b) => b.sector === sectorFilter) : beds;
  const bedsBySector = sectores.reduce((acc, s) => {
    acc[s] = bedsVisible.filter((b) => b.sector === s);
    return acc;
  }, {});

  // Si no hay filtro concreto de sector o hay camas sin sector previo
  const sinSector = bedsVisible.filter((b) => !b.sector);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.codigo.trim() || !addForm.sector.trim()) {
      toast.error('Código y sector son obligatorios');
      return;
    }
    setSavingNew(true);
    try {
      await createBed(addForm);
      toast.success(`Cama ${addForm.codigo} agregada`);
      setAddForm(initialForm);
      setShowAddForm(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear la cama');
    } finally {
      setSavingNew(false);
    }
  };

  const openEdit = (bed) => {
    setEditingId(bed._id);
    setEditForm({ estado: bed.estado, observaciones: bed.observaciones || '' });
  };

  const handleEditSubmit = async (bedId) => {
    setSavingEdit(true);
    try {
      await updateBed(bedId, editForm);
      toast.success('Cama actualizada');
      setEditingId(null);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar la cama');
    } finally {
      setSavingEdit(false);
    }
  };

  const BedCard = ({ bed }) => {
    const cfg = ESTADO_CFG[bed.estado] || ESTADO_CFG.libre;
    const isEditing = editingId === bed._id;
    const editAllowed = canEdit(role);

    return (
      <article
        style={{
          border: `2px solid ${cfg.borde}`,
          borderRadius: '10px',
          backgroundColor: cfg.bg,
          padding: '10px',
          cursor: editAllowed ? 'pointer' : 'default',
          position: 'relative',
          minHeight: '90px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <strong style={{ fontSize: '1rem', color: cfg.texto }}>
            {cfg.icono} {bed.codigo}
          </strong>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              color: cfg.texto,
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderRadius: '4px',
              padding: '1px 5px',
            }}
          >
            {cfg.label}
          </span>
        </div>

        {bed.paciente?.nombre && (
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: cfg.texto, fontWeight: '600' }}>
            👤 {bed.paciente.nombre}
          </p>
        )}
        {bed.observaciones && (
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: cfg.texto, opacity: 0.8 }}>
            {bed.observaciones.slice(0, 60)}{bed.observaciones.length > 60 ? '…' : ''}
          </p>
        )}

        {editAllowed && !isEditing && (
          <button
            type="button"
            onClick={() => openEdit(bed)}
            style={{
              marginTop: '6px',
              background: 'rgba(255,255,255,0.7)',
              border: `1px solid ${cfg.borde}`,
              borderRadius: '5px',
              padding: '3px 8px',
              fontSize: '0.75rem',
              color: cfg.texto,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            ✏️ Editar
          </button>
        )}

        {isEditing && (
          <div
            style={{
              marginTop: '8px',
              background: '#fff',
              borderRadius: '8px',
              padding: '10px',
              border: '1px solid #d1d5db',
            }}
          >
            <select
              className={styles.select}
              value={editForm.estado}
              onChange={(e) => setEditForm((f) => ({ ...f, estado: e.target.value }))}
              style={{ marginBottom: '6px', minWidth: 'unset' }}
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>{ESTADO_CFG[s]?.icono} {ESTADO_CFG[s]?.label}</option>
              ))}
            </select>
            <textarea
              rows={2}
              placeholder="Observaciones..."
              value={editForm.observaciones}
              onChange={(e) => setEditForm((f) => ({ ...f, observaciones: e.target.value.slice(0, 400) }))}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '6px',
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={styles.pill}
                onClick={() => handleEditSubmit(bed._id)}
                disabled={savingEdit}
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', flex: 1 }}
              >
                {savingEdit ? '...' : '✔ Guardar'}
              </button>
              <button
                type="button"
                className={styles.pill}
                onClick={() => setEditingId(null)}
                style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </article>
    );
  };

  const SectorGroup = ({ sector, bedList }) => {
    const estadoCounts = bedList.reduce((acc, b) => {
      acc[b.estado] = (acc[b.estado] || 0) + 1;
      return acc;
    }, {});
    const libres = estadoCounts.libre || 0;
    const ocup = bedList.length - libres;

    return (
      <div key={sector} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.sectorHeader}>
          <span>🏥 {sector || 'Sin sector'}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '400' }}>
            {libres} libre{libres !== 1 ? 's' : ''} · {ocup} ocupada{ocup !== 1 ? 's' : ''} · {bedList.length} total
          </span>
        </div>
        <div className={styles.grid}>
          {bedList.map((bed) => <BedCard key={bed._id} bed={bed} />)}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.actionsRow}>
          <div>
            <h1>🏥 Pizarra Digital — Censo de Camas</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#3b5d7c' }}>
              Estado en tiempo real de todas las camas por sector.
            </p>
          </div>
          <button
            type="button"
            className={styles.pill}
            onClick={cargar}
            disabled={loading}
            style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none' }}
          >
            {loading ? 'Actualizando...' : '🔄 Actualizar'}
          </button>
          <button
            type="button"
            className={styles.pill}
            onClick={handleExportExcel}
            style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
          >
            Exportar Excel
          </button>
        </div>

        {/* STATS */}
        <div className={styles.gridMini} style={{ marginTop: '1rem' }}>
          <div className={styles.miniCard} style={{ textAlign: 'center' }}>
            <strong>Total camas</strong>
            <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1f2937', margin: '4px 0 0' }}>
              {metrics.total}
            </p>
          </div>
          {Object.entries(ESTADO_CFG).map(([key, cfg]) => {
            const count = metrics.byEstado?.[key] || 0;
            return (
              <div
                key={key}
                className={styles.miniCard}
                style={{ backgroundColor: cfg.bg, borderLeft: `3px solid ${cfg.borde}`, textAlign: 'center' }}
              >
                <strong style={{ color: cfg.texto, fontSize: '0.85rem' }}>{cfg.icono} {cfg.label}</strong>
                <p style={{ fontSize: '1.6rem', fontWeight: '800', color: cfg.texto, margin: '4px 0 0' }}>{count}</p>
              </div>
            );
          })}
        </div>

        {ultimaActualizacion && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            Última actualización: {ultimaActualizacion.toLocaleTimeString()}
          </p>
        )}
      </section>

      {/* CONTROLES */}
      <section className={styles.card}>
        <div className={styles.actionsRow}>
          <div className={styles.filterRow} style={{ margin: 0 }}>
            <label style={{ fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Sector:</label>
            <select
              className={styles.select}
              style={{ minWidth: '200px', marginBottom: 0 }}
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
            >
              <option value="">Todos los sectores</option>
              {sectores.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {canCreate(role) && (
            <button
              type="button"
              className={styles.pill}
              onClick={() => setShowAddForm((p) => !p)}
              style={{ backgroundColor: '#059669', color: '#fff', border: 'none' }}
            >
              {showAddForm ? '— Cancelar' : '+ Agregar cama'}
            </button>
          )}
        </div>

        {/* FORMULARIO AGREGAR CAMA */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className={styles.form} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#0369a1' }}>Nueva cama</h3>
            <div className={styles.grid3}>
              <div>
                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Código *</label>
                <input
                  className={styles.input}
                  style={{ marginTop: '4px' }}
                  value={addForm.codigo}
                  onChange={(e) => setAddForm((f) => ({ ...f, codigo: e.target.value }))}
                  placeholder="Ej: H101"
                  maxLength={20}
                  required
                />
              </div>
              <div>
                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sector *</label>
                <input
                  className={styles.input}
                  style={{ marginTop: '4px' }}
                  value={addForm.sector}
                  onChange={(e) => setAddForm((f) => ({ ...f, sector: e.target.value }))}
                  placeholder="Ej: Guardia, UTI, Pediatría"
                  maxLength={60}
                  list="sectores-list"
                  required
                />
                <datalist id="sectores-list">
                  {sectores.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div>
                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Estado inicial</label>
                <select
                  className={styles.select}
                  style={{ marginTop: '4px' }}
                  value={addForm.estado}
                  onChange={(e) => setAddForm((f) => ({ ...f, estado: e.target.value }))}
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>{ESTADO_CFG[s]?.icono} {ESTADO_CFG[s]?.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Observaciones</label>
              <input
                className={styles.input}
                style={{ marginTop: '4px' }}
                value={addForm.observaciones}
                onChange={(e) => setAddForm((f) => ({ ...f, observaciones: e.target.value.slice(0, 400) }))}
                placeholder="Ej: Oxígeno central, aislamiento preventivo..."
                maxLength={400}
              />
            </div>
            <button
              type="submit"
              className={styles.pill}
              disabled={savingNew}
              style={{ backgroundColor: '#059669', color: '#fff', border: 'none', justifySelf: 'start' }}
            >
              {savingNew ? 'Guardando...' : '💾 Guardar cama'}
            </button>
          </form>
        )}
      </section>

      {/* LEYENDA */}
      <section className={styles.card}>
        <h3 style={{ margin: '0 0 0.75rem' }}>Referencia de estados</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(ESTADO_CFG).map(([key, cfg]) => (
            <span
              key={key}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                backgroundColor: cfg.bg,
                color: cfg.texto,
                border: `1px solid ${cfg.borde}`,
              }}
            >
              {cfg.icono} {cfg.label}
            </span>
          ))}
        </div>
      </section>

      {/* PLANO DE CAMAS */}
      <section className={styles.card}>
        {loading && <p style={{ color: '#9ca3af' }}>Cargando censo de camas...</p>}

        {!loading && beds.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🛏️</p>
            <p>No hay camas registradas.
              {canCreate(role) && ' Usa el botón "+ Agregar cama" para comenzar.'}
            </p>
          </div>
        )}

        {!loading && bedsVisible.length === 0 && beds.length > 0 && (
          <p style={{ color: '#9ca3af' }}>No hay camas para el sector seleccionado.</p>
        )}

        {sectores
          .filter((s) => !sectorFilter || s === sectorFilter)
          .map((s) => (
            <SectorGroup key={s} sector={s} bedList={bedsBySector[s] || []} />
          ))}

        {sinSector.length > 0 && (
          <SectorGroup sector="Sin sector asignado" bedList={sinSector} />
        )}
      </section>

      {/* ACCIONES RÁPIDAS por estado */}
      {canEdit(role) && beds.length > 0 && (
        <section className={styles.card}>
          <h3>Acciones rápidas — Limpiar camas terminadas (limpieza → libre)</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.25rem 0 1rem' }}>
            Marca como disponibles todas las camas que están en estado "Limpieza".
          </p>
          <button
            type="button"
            className={styles.pill}
            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
            onClick={async () => {
              const camas = beds.filter((b) => b.estado === 'limpieza');
              if (camas.length === 0) { toast.info('No hay camas en estado Limpieza'); return; }
              try {
                await Promise.all(camas.map((b) => updateBed(b._id, { estado: 'libre' })));
                toast.success(`${camas.length} cama${camas.length !== 1 ? 's' : ''} marcada${camas.length !== 1 ? 's' : ''} como Libre`);
                cargar();
              } catch {
                toast.error('Error en la actualización masiva');
              }
            }}
          >
            🧹 Liberar camas de limpieza ({metrics.byEstado?.limpieza || 0})
          </button>
        </section>
      )}
    </div>
  );
}
