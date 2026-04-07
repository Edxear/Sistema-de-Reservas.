import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  createNursingWoundPhoto,
  listNursingWoundPhotos,
  updateNursingWoundPhoto,
} from '../../services/enfermeriaService';
import styles from './Enfermeria.module.css';

const DEFAULT_CATALOG = {
  tiposHerida: ['Ulcera por presion', 'Herida quirurgica', 'Pie diabetico', 'Traumatica', 'Quemadura'],
  zonasCorporales: ['Sacro', 'Talon derecho', 'Talon izquierdo', 'Gluteo', 'Pierna', 'Abdomen'],
  estadiosHerida: ['Estadio 1', 'Estadio 2', 'Estadio 3', 'Estadio 4', 'No clasificada'],
};

const InfoBtn = ({ texto }) => (
  <button
    type="button"
    onClick={() => alert(texto)}
    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', opacity: 0.7 }}
    title="Mas informacion"
  >
    i
  </button>
);

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
  reader.readAsDataURL(file);
});

export default function FotosHeridas({ branches = [], scope = {}, permissions = {} }) {
  const catalog = DEFAULT_CATALOG;

  const [ramaFiltro, setRamaFiltro] = useState(scope?.rama || '');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState({
    rama: scope?.rama || branches[0] || 'Guardia',
    pacienteRef: '',
    tipoHerida: catalog.tiposHerida[0] || 'Herida',
    zonaCorporal: catalog.zonasCorporales[0] || '',
    estadio: catalog.estadiosHerida[0] || '',
    observaciones: '',
    imageDataUrl: '',
  });

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await listNursingWoundPhotos({ rama: ramaFiltro || undefined });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar el historial de fotos');
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imagenes');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      toast.error('La imagen supera el maximo recomendado (2.5MB)');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      setForm((prev) => ({ ...prev, imageDataUrl: dataUrl }));
    } catch (error) {
      toast.error(error.message || 'No se pudo procesar la imagen');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!permissions?.canCreateChecklist) {
      toast.error('No tienes permisos para registrar fotos');
      return;
    }
    if (!form.imageDataUrl) {
      toast.error('Debes seleccionar una foto');
      return;
    }
    try {
      setUploading(true);
      await createNursingWoundPhoto(form);
      toast.success('Foto de herida registrada');
      setForm((prev) => ({ ...prev, pacienteRef: '', observaciones: '', imageDataUrl: '' }));
      setPreview('');
      await loadPhotos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar la foto');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateNursingWoundPhoto(item._id, { activo: !item.activo });
      await loadPhotos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el estado de la foto');
    }
  };

  return (
    <div>
      <section className={styles.card} style={{ borderLeft: '4px solid #0ea5e9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2>Fotos de Heridas</h2>
            <p style={{ color: '#6b7280' }}>Registro visual evolutivo para seguimiento clinico y continuidad de cuidados.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <InfoBtn texto={'Uso recomendado:\n1) Subir foto por turno en mismo angulo\n2) Completar tipo, zona y estadio\n3) Documentar observaciones clave\n4) Usar historial para comparar evolucion'} />
          </div>
        </div>
      </section>

      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <h3>Cargar nueva foto</h3>
        <form onSubmit={onSubmit} className={styles.gridMini}>
          <select className={styles.select} value={form.rama} onChange={(e) => setForm((p) => ({ ...p, rama: e.target.value }))}>
            {branches.map((rama) => <option key={rama} value={rama}>{rama}</option>)}
          </select>
          <input className={styles.select} placeholder="Paciente referencia" value={form.pacienteRef} onChange={(e) => setForm((p) => ({ ...p, pacienteRef: e.target.value }))} />
          <select className={styles.select} value={form.tipoHerida} onChange={(e) => setForm((p) => ({ ...p, tipoHerida: e.target.value }))}>
            {catalog.tiposHerida.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <select className={styles.select} value={form.zonaCorporal} onChange={(e) => setForm((p) => ({ ...p, zonaCorporal: e.target.value }))}>
            {catalog.zonasCorporales.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <select className={styles.select} value={form.estadio} onChange={(e) => setForm((p) => ({ ...p, estadio: e.target.value }))}>
            {catalog.estadiosHerida.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <textarea className={styles.select} placeholder="Observaciones del turno" value={form.observaciones} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))} />
          <input type="file" accept="image/*" className={styles.select} onChange={onFileChange} />
          <button className={styles.pill} type="submit" disabled={uploading}>{uploading ? 'Guardando...' : 'Guardar foto'}</button>
        </form>
        {preview ? <img src={preview} alt="Vista previa" style={{ marginTop: '0.75rem', maxWidth: '240px', borderRadius: '8px', border: '1px solid #d1d5db' }} /> : null}
      </section>

      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <div className={styles.actionsRow}>
          <h3>Historial de fotos</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select className={styles.select} value={ramaFiltro} onChange={(e) => setRamaFiltro(e.target.value)}>
              <option value="">Todas las ramas</option>
              {branches.map((rama) => <option key={rama} value={rama}>{rama}</option>)}
            </select>
            <button type="button" className={styles.pill} onClick={loadPhotos}>Actualizar</button>
          </div>
        </div>

        {loading ? <p>Cargando fotos...</p> : null}

        <div className={styles.gridMini}>
          {items.map((item) => (
            <article key={item._id} className={styles.miniCard}>
              <img src={item.imageDataUrl} alt={item.tipoHerida} style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <p><strong>{item.tipoHerida}</strong> - {item.estadio || 'Sin estadio'}</p>
              <p>Paciente: {item.pacienteRef || 'Sin referencia'}</p>
              <p>Zona: {item.zonaCorporal || '-'}</p>
              <p>Rama: {item.rama}</p>
              <p>Fecha: {new Date(item.tomadaEn || item.createdAt).toLocaleString()}</p>
              <p>Obs: {item.observaciones || 'Sin observaciones'}</p>
              {permissions?.canManageIncidentStatus ? (
                <button type="button" className={styles.pill} onClick={() => toggleActive(item)}>
                  {item.activo ? 'Archivar' : 'Reactivar'}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
