import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  listOrdenesMedicas,
  crearOrdenMedica,
  actualizarEstadoOrden,
  buscarUsuarios,
} from '../../services/ordenMedicaService';
import { exportArrayToExcel } from '../../utils/excelExport';
import styles from './Clinical.module.css';

const TIPOS = ['laboratorio', 'imagen', 'interconsulta', 'procedimiento'];
const TIPO_ICONO = { laboratorio: '🧪', imagen: '🩻', interconsulta: '👨‍⚕️', procedimiento: '🔧' };
const ESTADOS = ['solicitada', 'en_proceso', 'completada', 'cancelada'];
const PRIORIDADES = ['urgente', 'alta', 'media', 'baja'];

const PRIORIDAD_CFG = {
  urgente: { bg: '#fee2e2', borde: '#ef4444', texto: '#7f1d1d', label: 'Urgente' },
  alta:    { bg: '#ffedd5', borde: '#f97316', texto: '#7c2d12', label: 'Alta'    },
  media:   { bg: '#fef9c3', borde: '#f59e0b', texto: '#92400e', label: 'Media'   },
  baja:    { bg: '#d1fae5', borde: '#10b981', texto: '#065f46', label: 'Baja'    },
};

const ESTADO_CFG = {
  solicitada:  { bg: '#eff6ff', borde: '#93c5fd', texto: '#1e3a8a', label: 'Solicitada'  },
  en_proceso:  { bg: '#fef9c3', borde: '#f59e0b', texto: '#92400e', label: 'En proceso'  },
  completada:  { bg: '#d1fae5', borde: '#10b981', texto: '#065f46', label: 'Completada'  },
  cancelada:   { bg: '#f3f4f6', borde: '#9ca3af', texto: '#4b5563', label: 'Cancelada'   },
};

const canCreate = (role) => ['medico', 'admin', 'superadmin'].includes(String(role || '').toLowerCase());
const canUpdateStatus = (role) => ['medico', 'admin', 'superadmin', 'enfermero'].includes(String(role || '').toLowerCase());

const initialForm = {
  pacienteId: '',
  pacienteNombre: '',
  tipo: 'laboratorio',
  prioridad: 'media',
  indicacion: '',
  diagnostico: '',
  fechaObjetivo: '',
};

export default function OrdenesMedicas() {
  const { user } = useAuth();
  const role = user?.rol;

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ estado: '', tipo: '', prioridad: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPaciente, setSearchingPaciente] = useState(false);
  const searchTimeout = useRef(null);

  // Status edit
  const [editingId, setEditingId] = useState(null);
  const [editEstado, setEditEstado] = useState('');
  const [editResultado, setEditResultado] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.estado) params.estado = filters.estado;
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.prioridad) params.prioridad = filters.prioridad;
      const data = await listOrdenesMedicas(params);
      setOrdenes(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { cargar(); }, [cargar]);

  const buscarPaciente = (term) => {
    setPatientSearch(term);
    clearTimeout(searchTimeout.current);
    if (term.length < 2) { setPatientResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchingPaciente(true);
      try {
        const res = await buscarUsuarios({ rol: 'paciente', search: term });
        setPatientResults(Array.isArray(res) ? res : []);
      } catch {
        setPatientResults([]);
      } finally {
        setSearchingPaciente(false);
      }
    }, 350);
  };

  const selectPaciente = (p) => {
    setForm((f) => ({ ...f, pacienteId: p._id, pacienteNombre: p.nombre }));
    setPatientSearch(p.nombre);
    setPatientResults([]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.pacienteId) { toast.error('Seleccioná un paciente de la lista'); return; }
    if (!form.indicacion.trim()) { toast.error('La indicación es obligatoria'); return; }
    setSaving(true);
    try {
      await crearOrdenMedica({
        paciente: form.pacienteId,
        tipo: form.tipo,
        prioridad: form.prioridad,
        indicacion: form.indicacion.trim(),
        diagnostico: form.diagnostico.trim(),
        fechaObjetivo: form.fechaObjetivo || undefined,
      });
      toast.success('Orden médica creada');
      setForm(initialForm);
      setPatientSearch('');
      setShowForm(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear la orden');
    } finally {
      setSaving(false);
    }
  };

  const openEditStatus = (orden) => {
    setEditingId(orden._id);
    setEditEstado(orden.estado);
    setEditResultado(orden.resultadoResumen || '');
  };

  const handleSaveStatus = async (id) => {
    setSavingStatus(true);
    try {
      await actualizarEstadoOrden(id, { estado: editEstado, resultadoResumen: editResultado });
      toast.success('Estado actualizado');
      setEditingId(null);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setSavingStatus(false);
    }
  };

  const stats = {
    total: ordenes.length,
    urgente: ordenes.filter((o) => o.prioridad === 'urgente').length,
    solicitada: ordenes.filter((o) => o.estado === 'solicitada').length,
    en_proceso: ordenes.filter((o) => o.estado === 'en_proceso').length,
    completada: ordenes.filter((o) => o.estado === 'completada').length,
  };

  const handleExportExcel = () => {
    if (!ordenes.length) {
      toast.info('No hay ordenes para exportar');
      return;
    }

    const rows = ordenes.map((orden) => ({
      Paciente: orden.paciente?.nombre || '',
      DNI: orden.paciente?.documento || '',
      ObraSocial: orden.paciente?.obraSocial || '',
      Medico: orden.medico?.nombre || '',
      Especialidad: orden.medico?.especialidad || '',
      Tipo: orden.tipo,
      Prioridad: orden.prioridad,
      Estado: orden.estado,
      FechaObjetivo: orden.fechaObjetivo ? new Date(orden.fechaObjetivo).toLocaleDateString('es-AR') : '',
      Indicacion: orden.indicacion || '',
      Diagnostico: orden.diagnostico || '',
      Resultado: orden.resultadoResumen || '',
    }));

    exportArrayToExcel({
      rows,
      sheetName: 'Ordenes',
      fileName: `ordenes-medicas-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
  };

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.actionsRow}>
          <div>
            <h1>📋 Órdenes Médicas</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#3b5d7c' }}>
              {role === 'medico'
                ? 'Tus órdenes activas. Creá nuevas órdenes para pacientes.'
                : 'Visualizá y ejecutá órdenes médicas asignadas.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={styles.pill}
              onClick={cargar}
              disabled={loading}
              style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none' }}
            >
              {loading ? 'Cargando...' : '🔄 Actualizar'}
            </button>
            <button
              type="button"
              className={styles.pill}
              onClick={handleExportExcel}
              style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none' }}
            >
              Exportar Excel
            </button>
            {canCreate(role) && (
              <button
                type="button"
                className={styles.pill}
                onClick={() => setShowForm((p) => !p)}
                style={{ backgroundColor: '#059669', color: '#fff', border: 'none' }}
              >
                {showForm ? '— Cancelar' : '+ Nueva orden'}
              </button>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className={styles.gridMini} style={{ marginTop: '1rem' }}>
          <div className={styles.miniCard}>
            <strong>Total</strong>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1f2937', margin: '4px 0 0' }}>{stats.total}</p>
          </div>
          <div className={styles.miniCard} style={{ backgroundColor: PRIORIDAD_CFG.urgente.bg, borderLeft: `3px solid ${PRIORIDAD_CFG.urgente.borde}` }}>
            <strong style={{ color: PRIORIDAD_CFG.urgente.texto }}>Urgentes</strong>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: PRIORIDAD_CFG.urgente.texto, margin: '4px 0 0' }}>{stats.urgente}</p>
          </div>
          <div className={styles.miniCard} style={{ backgroundColor: ESTADO_CFG.solicitada.bg, borderLeft: `3px solid ${ESTADO_CFG.solicitada.borde}` }}>
            <strong style={{ color: ESTADO_CFG.solicitada.texto }}>Solicitadas</strong>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: ESTADO_CFG.solicitada.texto, margin: '4px 0 0' }}>{stats.solicitada}</p>
          </div>
          <div className={styles.miniCard} style={{ backgroundColor: ESTADO_CFG.en_proceso.bg, borderLeft: `3px solid ${ESTADO_CFG.en_proceso.borde}` }}>
            <strong style={{ color: ESTADO_CFG.en_proceso.texto }}>En proceso</strong>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: ESTADO_CFG.en_proceso.texto, margin: '4px 0 0' }}>{stats.en_proceso}</p>
          </div>
          <div className={styles.miniCard} style={{ backgroundColor: ESTADO_CFG.completada.bg, borderLeft: `3px solid ${ESTADO_CFG.completada.borde}` }}>
            <strong style={{ color: ESTADO_CFG.completada.texto }}>Completadas</strong>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: ESTADO_CFG.completada.texto, margin: '4px 0 0' }}>{stats.completada}</p>
          </div>
        </div>
      </section>

      {/* FORMULARIO NUEVA ORDEN */}
      {showForm && canCreate(role) && (
        <section className={styles.card} style={{ border: '1px solid #a7f3d0' }}>
          <h2 style={{ color: '#065f46' }}>➕ Nueva Orden Médica</h2>
          <form onSubmit={handleCreate} className={styles.form}>
            {/* BÚSQUEDA DE PACIENTE */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                Paciente *
              </label>
              <input
                className={styles.input}
                style={{ marginBottom: 0 }}
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={patientSearch}
                onChange={(e) => buscarPaciente(e.target.value)}
                autoComplete="off"
              />
              {searchingPaciente && (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '4px 0' }}>Buscando...</p>
              )}
              {patientResults.length > 0 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {patientResults.map((p) => (
                    <li
                      key={p._id}
                      onClick={() => selectPaciente(p)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '0.9rem',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <strong>{p.nombre}</strong>
                      {p.documento && <span style={{ color: '#6b7280', marginLeft: '8px' }}>DNI: {p.documento}</span>}
                      {p.email && <span style={{ color: '#9ca3af', marginLeft: '8px', fontSize: '0.8rem' }}>{p.email}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {form.pacienteId && (
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#065f46', fontWeight: '600' }}>
                  ✅ Paciente seleccionado: {form.pacienteNombre}
                </p>
              )}
            </div>

            <div className={styles.grid3}>
              <div>
                <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Tipo *</label>
                <select
                  className={styles.select}
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{TIPO_ICONO[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Prioridad</label>
                <select
                  className={styles.select}
                  value={form.prioridad}
                  onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
                >
                  {PRIORIDADES.map((p) => (
                    <option key={p} value={p}>{PRIORIDAD_CFG[p]?.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Fecha objetivo</label>
                <input
                  type="date"
                  className={styles.input}
                  value={form.fechaObjetivo}
                  onChange={(e) => setForm((f) => ({ ...f, fechaObjetivo: e.target.value }))}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Indicación *</label>
              <textarea
                rows={3}
                value={form.indicacion}
                onChange={(e) => setForm((f) => ({ ...f, indicacion: e.target.value.slice(0, 800) }))}
                placeholder="Detalle clínico de la orden..."
                maxLength={800}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  border: '1px solid #c7d8ea',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Diagnóstico presuntivo</label>
              <input
                className={styles.input}
                style={{ marginBottom: 0 }}
                value={form.diagnostico}
                onChange={(e) => setForm((f) => ({ ...f, diagnostico: e.target.value.slice(0, 300) }))}
                placeholder="Ej: Neumonía atípica, fractura de fémur..."
                maxLength={300}
              />
            </div>

            <button
              type="submit"
              className={styles.pill}
              disabled={saving}
              style={{ backgroundColor: saving ? '#9ca3af' : '#059669', color: '#fff', border: 'none', justifySelf: 'start' }}
            >
              {saving ? 'Guardando...' : '💾 Crear Orden'}
            </button>
          </form>
        </section>
      )}

      {/* FILTROS */}
      <section className={styles.card}>
        <div className={styles.actionsRow}>
          <h2 style={{ margin: 0 }}>Lista de Órdenes</h2>
          <div className={styles.filterRow} style={{ margin: 0 }}>
            <select
              className={styles.select}
              style={{ minWidth: '150px', marginBottom: 0 }}
              value={filters.estado}
              onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((s) => <option key={s} value={s}>{ESTADO_CFG[s]?.label}</option>)}
            </select>
            <select
              className={styles.select}
              style={{ minWidth: '150px', marginBottom: 0 }}
              value={filters.tipo}
              onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value }))}
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map((t) => <option key={t} value={t}>{TIPO_ICONO[t]} {t}</option>)}
            </select>
            <select
              className={styles.select}
              style={{ minWidth: '150px', marginBottom: 0 }}
              value={filters.prioridad}
              onChange={(e) => setFilters((f) => ({ ...f, prioridad: e.target.value }))}
            >
              <option value="">Todas las prioridades</option>
              {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDAD_CFG[p]?.label}</option>)}
            </select>
          </div>
        </div>

        {loading && <p style={{ color: '#9ca3af', marginTop: '1rem' }}>Cargando órdenes...</p>}

        {!loading && ordenes.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📋</p>
            <p>No hay órdenes con los filtros seleccionados.</p>
          </div>
        )}

        {!loading && ordenes.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'grid', gap: '10px' }}>
            {ordenes.map((orden) => {
              const prioridadCfg = PRIORIDAD_CFG[orden.prioridad] || PRIORIDAD_CFG.media;
              const estadoCfg = ESTADO_CFG[orden.estado] || ESTADO_CFG.solicitada;
              const isEditing = editingId === orden._id;
              const fechaReferencia = orden.fechaOrden || orden.createdAt || orden.fechaObjetivo;

              return (
                <article
                  key={orden._id}
                  style={{
                    border: `1.5px solid ${prioridadCfg.borde}`,
                    borderLeft: `4px solid ${prioridadCfg.borde}`,
                    borderRadius: '10px',
                    padding: '14px',
                    backgroundColor: '#fafcff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.2rem' }}>{TIPO_ICONO[orden.tipo]}</span>
                      <strong style={{ color: '#1f2937' }}>
                        {orden.tipo?.charAt(0).toUpperCase() + orden.tipo?.slice(1)}
                      </strong>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          backgroundColor: prioridadCfg.bg,
                          color: prioridadCfg.texto,
                          border: `1px solid ${prioridadCfg.borde}`,
                        }}
                      >
                        {prioridadCfg.label}
                      </span>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          backgroundColor: estadoCfg.bg,
                          color: estadoCfg.texto,
                          border: `1px solid ${estadoCfg.borde}`,
                        }}
                      >
                        {estadoCfg.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      {fechaReferencia
                        ? new Date(fechaReferencia).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Sin fecha'}
                    </span>
                  </div>

                  <div className={styles.grid3} style={{ marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Paciente</span>
                      <p style={{ margin: '2px 0 0', fontWeight: '600', color: '#374151' }}>
                        {orden.paciente?.nombre || '—'}
                        {orden.paciente?.documento && (
                          <span style={{ fontWeight: '400', color: '#9ca3af', marginLeft: '6px', fontSize: '0.8rem' }}>
                            DNI {orden.paciente.documento}
                          </span>
                        )}
                      </p>
                      {!!orden.paciente?.obraSocial && (
                        <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                          Cobertura: {orden.paciente.obraSocial}
                        </p>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Médico</span>
                      <p style={{ margin: '2px 0 0', color: '#374151' }}>
                        {orden.medico?.nombre || '—'}
                        {orden.medico?.especialidad && (
                          <span style={{ color: '#9ca3af', marginLeft: '4px', fontSize: '0.8rem' }}>
                            ({orden.medico.especialidad})
                          </span>
                        )}
                      </p>
                      {!!orden.medico?.matriculaProfesional && (
                        <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                          MP: {orden.medico.matriculaProfesional}
                        </p>
                      )}
                    </div>
                    {orden.fechaObjetivo && (
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Fecha objetivo</span>
                        <p style={{ margin: '2px 0 0', color: '#374151' }}>
                          {new Date(orden.fechaObjetivo).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    )}
                  </div>

                  <p style={{ margin: '0 0 6px', color: '#374151', fontSize: '0.9rem' }}>
                    <strong>Indicación:</strong> {orden.indicacion}
                  </p>
                  {orden.diagnostico && (
                    <p style={{ margin: '0 0 6px', color: '#6b7280', fontSize: '0.85rem' }}>
                      <strong>Diagnóstico:</strong> {orden.diagnostico}
                    </p>
                  )}
                  {orden.resultadoResumen && (
                    <p style={{ margin: '0 0 6px', color: '#065f46', fontSize: '0.85rem', backgroundColor: '#d1fae5', padding: '6px 10px', borderRadius: '6px' }}>
                      <strong>Resultado:</strong> {orden.resultadoResumen}
                    </p>
                  )}

                  {canUpdateStatus(role) && !isEditing && orden.estado !== 'completada' && orden.estado !== 'cancelada' && (
                    <button
                      type="button"
                      className={styles.pill}
                      onClick={() => openEditStatus(orden)}
                      style={{ marginTop: '8px', fontSize: '0.82rem' }}
                    >
                      ✏️ Actualizar estado
                    </button>
                  )}

                  {isEditing && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#f8faff', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                      <div className={styles.grid3}>
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Nuevo estado</label>
                          <select
                            className={styles.select}
                            value={editEstado}
                            onChange={(e) => setEditEstado(e.target.value)}
                          >
                            {ESTADOS.map((s) => <option key={s} value={s}>{ESTADO_CFG[s]?.label}</option>)}
                          </select>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Resultado / observación</label>
                          <input
                            className={styles.input}
                            value={editResultado}
                            onChange={(e) => setEditResultado(e.target.value.slice(0, 1200))}
                            placeholder="Ej: Hemograma completo realizado. Resultado adjunto en HC."
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className={styles.pill}
                          onClick={() => handleSaveStatus(orden._id)}
                          disabled={savingStatus}
                          style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                        >
                          {savingStatus ? '...' : '✔ Guardar'}
                        </button>
                        <button
                          type="button"
                          className={styles.pill}
                          onClick={() => setEditingId(null)}
                          style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
