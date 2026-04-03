import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { createSupportTicket, listSupportTickets } from '../../services/soporteService';
import { isAdminRole } from '../../utils/roles';
import styles from './GestionObraSocial.module.css';

const CRITICIDAD = ['critico', 'alto', 'medio', 'bajo'];
const ESTADOS = ['abierto', 'en_progreso', 'en_espera', 'resuelto', 'cerrado'];

const initialForm = {
  obraSocial: '',
  tipoSolicitud: 'autorizacion',
  pacienteRef: '',
  nroAfiliado: '',
  descripcion: '',
  criticidad: 'medio',
};

export default function GestionObraSocial() {
  const { user } = useAuth();
  const role = user?.rol;
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: '', estado: '', desde: '', hasta: '' });

  const canUse = isAdminRole(role);

  const visibleRequests = useMemo(() => {
    const q = String(filters.q || '').trim().toLowerCase();
    const desdeTs = filters.desde ? new Date(`${filters.desde}T00:00:00`).getTime() : null;
    const hastaTs = filters.hasta ? new Date(`${filters.hasta}T23:59:59`).getTime() : null;

    return requests
      .filter((r) => (filters.estado ? r.estado === filters.estado : true))
      .filter((r) => {
        if (!q) return true;
        const haystack = [r.titulo, r.descripcion, r.codigo, (r.tags || []).join(' ')].join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .filter((r) => {
        const createdAt = new Date(r.createdAt).getTime();
        if (desdeTs && createdAt < desdeTs) return false;
        if (hastaTs && createdAt > hastaTs) return false;
        return true;
      });
  }, [requests, filters]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await listSupportTickets({ tipoGestion: 'obra_social' });
      const parsed = Array.isArray(data) ? data : [];
      setRequests(parsed.filter((t) => t.tipoGestion === 'obra_social'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar solicitudes de obra social');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canUse) {
      toast.error('Solo administradores pueden registrar solicitudes con obra social');
      return;
    }
    if (!form.obraSocial.trim() || !form.descripcion.trim()) {
      toast.error('Completa obra social y descripcion');
      return;
    }

    try {
      await createSupportTicket({
        titulo: `Solicitud ${form.tipoSolicitud} - ${form.obraSocial.trim()}`,
        descripcion: `${form.descripcion.trim()}${form.nroAfiliado?.trim() ? `\nAfiliado: ${form.nroAfiliado.trim()}` : ''}`,
        criticidad: form.criticidad,
        tipoGestion: 'obra_social',
        soporteNivel: 'L2',
        areaClinica: 'Gestion institucional',
        modulo: 'Obra Social',
        impactoClinico: form.pacienteRef?.trim() ? `Paciente referencia: ${form.pacienteRef.trim()}` : '',
        solicitanteNombre: user?.nombre || '',
        solicitanteRol: role || '',
        solicitanteArea: 'Gestion',
        requiresChangeValidation: false,
        tags: ['obra_social', 'interinstitucional', form.tipoSolicitud, form.obraSocial.trim().toLowerCase().replace(/\s+/g, '_')],
      });
      setForm(initialForm);
      toast.success('Solicitud registrada');
      await loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo registrar la solicitud');
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1>Solicitudes con Obra Social</h1>
        <p>Canal exclusivo para gestion interinstitucional entre clinica/hospital y financiadores.</p>

        <form onSubmit={handleSubmit} className={styles.gridForm}>
          <input className={styles.input} placeholder="Obra social" value={form.obraSocial} onChange={(e) => setForm((p) => ({ ...p, obraSocial: e.target.value }))} required />
          <select className={styles.select} value={form.tipoSolicitud} onChange={(e) => setForm((p) => ({ ...p, tipoSolicitud: e.target.value }))}>
            <option value="autorizacion">Autorizacion</option>
            <option value="rechazo">Reconsideracion de rechazo</option>
            <option value="auditoria">Auditoria / documentacion</option>
            <option value="facturacion">Ajuste de facturacion</option>
            <option value="prestacion">Alta o modificacion de prestacion</option>
          </select>
          <input className={styles.input} placeholder="Paciente referencia (opcional)" value={form.pacienteRef} onChange={(e) => setForm((p) => ({ ...p, pacienteRef: e.target.value }))} />
          <input className={styles.input} placeholder="Nro afiliado (opcional)" value={form.nroAfiliado} onChange={(e) => setForm((p) => ({ ...p, nroAfiliado: e.target.value }))} />
          <select className={styles.select} value={form.criticidad} onChange={(e) => setForm((p) => ({ ...p, criticidad: e.target.value }))}>
            {CRITICIDAD.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea className={styles.textarea} placeholder="Detalle de solicitud" value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} required />
          <button className={styles.primaryBtn} type="submit" disabled={!canUse}>Registrar solicitud</button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Historial de Solicitudes</h2>
        <div className={styles.filters}>
          <input className={styles.input} placeholder="Buscar por texto/codigo" value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} />
          <select className={styles.select} value={filters.estado} onChange={(e) => setFilters((p) => ({ ...p, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" className={styles.input} value={filters.desde} onChange={(e) => setFilters((p) => ({ ...p, desde: e.target.value }))} />
          <input type="date" className={styles.input} value={filters.hasta} onChange={(e) => setFilters((p) => ({ ...p, hasta: e.target.value }))} />
        </div>

        <div className={styles.listWrap}>
          {loading ? <p>Cargando...</p> : null}
          {!loading && visibleRequests.length === 0 ? <p>No hay solicitudes para los filtros aplicados.</p> : null}
          {!loading && visibleRequests.map((req) => (
            <div key={req._id} className={styles.item}>
              <div className={styles.itemTitle}>{req.titulo}</div>
              <div className={styles.meta}>Codigo: {req.codigo} | Estado: {req.estado} | Criticidad: {req.criticidad}</div>
              <p>{req.descripcion}</p>
              <div className={styles.meta}>Creado: {new Date(req.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
