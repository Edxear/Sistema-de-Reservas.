import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  createOrganigrama,
  deleteOrganigrama,
  getOrganigrama,
  updateOrganigrama,
} from '../services/organigramaService';
import organigramaHospitalario from '../data/organigramaHospitalario.json';
import styles from './Organigrama.module.css';

const estructuraEjemplo = organigramaHospitalario.bloques || [];

const normalizar = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const parsePuestos = (text = '') => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nombreRaw, personasRaw = ''] = line.split(':');
      const nombre = String(nombreRaw || '').trim();
      const personas = String(personasRaw || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      return { nombre, personas };
    })
    .filter((p) => p.nombre);
};

const formatPuestos = (puestos = []) => {
  return (puestos || [])
    .map((p) => `${p.nombre}: ${(p.personas || []).join(', ')}`)
    .join('\n');
};

export default function Organigrama() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const [editId, setEditId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const formSectionRef = useRef(null);
  const areaInputRef = useRef(null);
  const [form, setForm] = useState({
    area: '',
    jefe: '',
    subjefe: '',
    orden: 0,
    activo: true,
    equiposText: '',
    puestosText: '',
  });

  const hasData = rows.length > 0;

  const payloadFromForm = useMemo(
    () => ({
      area: form.area.trim(),
      jefe: form.jefe.trim(),
      subjefe: form.subjefe.trim(),
      orden: Number(form.orden) || 0,
      activo: !!form.activo,
      equipos: form.equiposText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      puestos: parsePuestos(form.puestosText),
    }),
    [form]
  );

  const filteredRows = useMemo(() => {
    const byStatus = rows.filter((row) => {
      if (statusFilter === 'activos') return row.activo !== false;
      if (statusFilter === 'inactivos') return row.activo === false;
      return true;
    });

    const q = normalizar(query);
    const byQuery = q
      ? byStatus.filter((row) => {
          const scope = [
            row.area,
            row.jefe,
            row.subjefe,
            ...(row.equipos || []),
            ...((row.puestos || []).map((p) => p.nombre)),
            ...((row.puestos || []).flatMap((p) => p.personas || [])),
          ]
            .filter(Boolean)
            .join(' ');
          return normalizar(scope).includes(q);
        })
      : byStatus;

    return [...byQuery].sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }, [rows, query, statusFilter]);

  const metrics = useMemo(() => {
    const total = rows.length;
    const activos = rows.filter((r) => r.activo !== false).length;
    const puestos = rows.reduce((acc, row) => acc + (row.puestos?.length || 0), 0);
    const personas = rows.reduce(
      (acc, row) => acc + (row.puestos || []).reduce((sum, p) => sum + (p.personas?.length || 0), 0),
      0
    );
    return { total, activos, puestos, personas };
  }, [rows]);

  const resetForm = () => {
    setEditId('');
    setForm({ area: '', jefe: '', subjefe: '', orden: 0, activo: true, equiposText: '', puestosText: '' });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOrganigrama(false);
      setRows(data || []);
      setUsingLocalFallback(false);
    } catch (error) {
      // Fallback: keep the page functional with the bundled hospital example.
      setRows((estructuraEjemplo || []).map((item, idx) => ({ ...item, _id: `local-${idx + 1}` })));
      setUsingLocalFallback(true);
      toast.warn(error.response?.data?.message || 'No se pudo cargar desde API. Se muestra el ejemplo local.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!payloadFromForm.area || !payloadFromForm.jefe) {
      toast.error('Área y jefe son obligatorios');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await updateOrganigrama(editId, payloadFromForm);
        toast.success('Bloque actualizado');
      } else {
        await createOrganigrama(payloadFromForm);
        toast.success('Bloque creado');
      }
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar el bloque');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row) => {
    setEditId(row._id);
    setForm({
      area: row.area || '',
      jefe: row.jefe || '',
      subjefe: row.subjefe || '',
      orden: row.orden || 0,
      activo: row.activo !== false,
      equiposText: (row.equipos || []).join(', '),
      puestosText: formatPuestos(row.puestos || []),
    });

    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      areaInputRef.current?.focus();
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar este bloque del organigrama?')) return;
    try {
      await deleteOrganigrama(id);
      toast.success('Bloque eliminado');
      if (editId === id) resetForm();
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar');
    }
  };

  const cargarEjemplo = async () => {
    setSaving(true);
    try {
      const existingAreas = new Set(rows.map((row) => String(row.area || '').toLowerCase()));
      const missing = estructuraEjemplo.filter((item) => !existingAreas.has(String(item.area || '').toLowerCase()));

      if (missing.length === 0) {
        toast.info('El ejemplo hospitalario ya está cargado');
      } else {
        await Promise.all(missing.map((item) => createOrganigrama({ ...item, activo: true })));
        toast.success(`Se cargaron ${missing.length} bloque(s) del ejemplo hospitalario`);
      }

      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar la estructura ejemplo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1>Organigrama Institucional</h1>
        <p>Estructura organizacional para un hospital o clínica, por áreas y rangos.</p>

        {isAdmin && (
          <div className={styles.headerActions}>
            {!hasData && (
              <button className={styles.secondaryBtn} onClick={cargarEjemplo} disabled={saving}>
                Cargar ejemplo hospitalario
              </button>
            )}
          </div>
        )}

        {usingLocalFallback && (
          <div className={styles.fallbackNote}>
            <p>Modo local: este organigrama se está mostrando desde el ejemplo embebido porque el endpoint no respondió.</p>
            <button className={styles.secondaryBtn} onClick={loadData} disabled={loading}>
              Reintentar conexión API
            </button>
          </div>
        )}

        <div className={styles.metricsRow}>
          <div className={styles.metricChip}><strong>{metrics.total}</strong><span>Áreas</span></div>
          <div className={styles.metricChip}><strong>{metrics.activos}</strong><span>Activas</span></div>
          <div className={styles.metricChip}><strong>{metrics.puestos}</strong><span>Puestos</span></div>
          <div className={styles.metricChip}><strong>{metrics.personas}</strong><span>Personas</span></div>
        </div>

        <div className={styles.controlsRow}>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por área, jefe, equipo, puesto o persona"
          />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
        </div>
      </section>

      <section className={styles.grid}>
        {loading && <p>Cargando organigrama...</p>}
        {!loading && filteredRows.length === 0 && (
          <p>No hay bloques cargados. {isAdmin ? 'Puedes crear uno nuevo o cargar el ejemplo.' : ''}</p>
        )}
        {!loading && filteredRows.map((bloque) => (
          <article
            key={bloque._id}
            className={`${styles.card} ${editId === bloque._id ? styles.cardEditing : ''}`}
          >
            <h2>{bloque.area}</h2>
            <p><strong>Jefe:</strong> {bloque.jefe}</p>
            <p><strong>Subjefe:</strong> {bloque.subjefe}</p>
            <p><strong>Estado:</strong> {bloque.activo ? 'Activo' : 'Inactivo'}</p>
            <div>
              <strong>Áreas / Equipos:</strong>
              <ul>
                {(bloque.equipos || []).map((equipo) => (
                  <li key={equipo}>{equipo}</li>
                ))}
              </ul>
            </div>
            {!!bloque.puestos?.length && (
              <div>
                <strong>Puestos y personas:</strong>
                <ul>
                  {bloque.puestos.map((puesto) => (
                    <li key={puesto.nombre}>
                      <strong>{puesto.nombre}:</strong> {(puesto.personas || []).join(', ') || 'Sin asignar'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isAdmin && (
              <div className={styles.cardActions}>
                <button className={styles.secondaryBtn} onClick={() => onEdit(bloque)}>Editar</button>
                <button className={styles.dangerBtn} onClick={() => onDelete(bloque._id)}>Eliminar</button>
              </div>
            )}
          </article>
        ))}
      </section>

      {isAdmin && (
        <section className={styles.formCard} ref={formSectionRef}>
          <h2>{editId ? 'Editar bloque' : 'Nuevo bloque'}</h2>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid2}>
              <label>
                Área
                <input
                  ref={areaInputRef}
                  value={form.area}
                  onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
                  required
                />
              </label>
              <label>
                Jefe
                <input
                  value={form.jefe}
                  onChange={(e) => setForm((prev) => ({ ...prev, jefe: e.target.value }))}
                  required
                />
              </label>
              <label>
                Subjefe
                <input
                  value={form.subjefe}
                  onChange={(e) => setForm((prev) => ({ ...prev, subjefe: e.target.value }))}
                />
              </label>
              <label>
                Orden
                <input
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm((prev) => ({ ...prev, orden: Number(e.target.value) }))}
                />
              </label>
            </div>

            <label>
              Equipos (separados por coma)
              <textarea
                value={form.equiposText}
                onChange={(e) => setForm((prev) => ({ ...prev, equiposText: e.target.value }))}
                placeholder="Ej: Guardia, Internacion, Farmacia"
              />
            </label>

            <label>
              Puestos y personas (una línea por puesto, formato: Puesto: Persona 1, Persona 2)
              <textarea
                value={form.puestosText}
                onChange={(e) => setForm((prev) => ({ ...prev, puestosText: e.target.value }))}
                placeholder={'Ej:\nJefe de Área: Dra. Sofia Martinez\nSubjefe: Dr. Mateo Ruiz'}
              />
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
              />
              <span>Activo</span>
            </label>

            <div className={styles.formActions}>
              {editId && (
                <button type="button" className={styles.secondaryBtn} onClick={resetForm}>
                  Cancelar edición
                </button>
              )}
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? 'Guardando...' : editId ? 'Actualizar bloque' : 'Crear bloque'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
