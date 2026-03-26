import React, { useEffect, useMemo, useState } from 'react';
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

export default function Organigrama() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState({
    area: '',
    jefe: '',
    subjefe: '',
    orden: 0,
    activo: true,
    equiposText: '',
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
    }),
    [form]
  );

  const resetForm = () => {
    setEditId('');
    setForm({ area: '', jefe: '', subjefe: '', orden: 0, activo: true, equiposText: '' });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOrganigrama(false);
      setRows(data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar el organigrama');
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
      </section>

      <section className={styles.grid}>
        {loading && <p>Cargando organigrama...</p>}
        {!loading && rows.length === 0 && (
          <p>No hay bloques cargados. {isAdmin ? 'Puedes crear uno nuevo o cargar el ejemplo.' : ''}</p>
        )}
        {!loading && rows.map((bloque) => (
          <article key={bloque._id} className={styles.card}>
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
        <section className={styles.formCard}>
          <h2>{editId ? 'Editar bloque' : 'Nuevo bloque'}</h2>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid2}>
              <label>
                Área
                <input
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
