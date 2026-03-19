import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';
import { getBookings } from '../services/bookingService';
import styles from './PacienteDetalle.module.css';

export default function PacienteDetalle() {
  const navigate = useNavigate();
  const { pacienteId } = useParams();

  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [recetas, setRecetas] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [bookingsRes, historialRes, recetasRes] = await Promise.all([
          getBookings({ usuario: pacienteId, limit: 200, page: 1 }),
          API.get(`/historia-clinica/paciente/${pacienteId}`),
          API.get(`/recetas/paciente/${pacienteId}`),
        ]);

        setBookings(bookingsRes.data?.bookings || []);
        setHistorial(historialRes.data || []);
        setRecetas(recetasRes.data || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'No se pudo cargar la ficha del paciente');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pacienteId]);

  useEffect(() => {
    const saved = sessionStorage.getItem('scroll:pacienteDetalle');
    if (!saved) return;
    const y = Number(saved);
    if (!Number.isNaN(y)) {
      requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'auto' }));
    }
    sessionStorage.removeItem('scroll:pacienteDetalle');
  }, []);

  const paciente = useMemo(() => {
    if (!bookings.length) return null;
    return bookings[0]?.usuario || null;
  }, [bookings]);

  const proximosTurnos = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => ['pendiente', 'confirmada', 'reprogramada'].includes(b.estado))
      .filter((b) => new Date(b.fecha) >= now)
      .slice(0, 5);
  }, [bookings]);

  const historialReciente = useMemo(() => historial.slice(0, 8), [historial]);
  const recetasRecientes = useMemo(() => recetas.slice(0, 8), [recetas]);

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>Ficha de paciente</h1>
          {loading ? (
            <p className={styles.subtitle}>Cargando datos...</p>
          ) : (
            <>
              <p className={styles.subtitle}>{paciente?.nombre || 'Paciente'} - {paciente?.email || 'Sin email'}</p>
              <p className={styles.subtitle}>Obra social: {paciente?.obraSocial || '-'} | Afiliado: {paciente?.numeroAfiliado || '-'}</p>
            </>
          )}
        </div>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={() => {
            sessionStorage.setItem('scroll:pacienteDetalle', String(window.scrollY));
            navigate(`/historial/${pacienteId}`);
          }}>Historia completa</button>
          <button className={styles.btn} onClick={() => navigate(`/recetas?pacienteId=${pacienteId}`)}>Nueva receta</button>
          <button className={styles.btn} onClick={() => navigate('/dashboard')}>Volver</button>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h3>Resumen clínico</h3>
          <p className={styles.meta}>Alergias: {paciente?.alergias || 'No registradas'}</p>
          <p className={styles.meta}>Telefono: {paciente?.telefono || '-'}</p>
          <p className={styles.meta}>Turnos totales: {bookings.length}</p>
          <p className={styles.meta}>Historias clínicas: {historial.length}</p>
          <p className={styles.meta}>Recetas: {recetas.length}</p>
        </article>

        <article className={styles.card}>
          <h3>Próximos turnos</h3>
          <div className={styles.timeline}>
            {proximosTurnos.length === 0 && <p className={styles.meta}>Sin próximos turnos.</p>}
            {proximosTurnos.map((turno) => (
              <div key={turno._id} className={styles.item}>
                <div className={styles.itemTitle}>{turno.servicio?.nombre || 'Servicio'} - {turno.hora}</div>
                <div className={styles.itemMeta}>{new Date(turno.fecha).toLocaleDateString()} | {turno.estado}</div>
                <div className={styles.itemMeta}>Profesional: {turno.medico?.nombre || '-'}</div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <h3>Timeline de historia clínica</h3>
          <div className={styles.timeline}>
            {historialReciente.length === 0 && <p className={styles.meta}>Sin registros clínicos.</p>}
            {historialReciente.map((entry) => (
              <div key={entry._id} className={styles.item}>
                <div className={styles.itemTitle}>{entry.tipo || 'evolucion'}</div>
                <div className={styles.itemMeta}>{new Date(entry.fecha).toLocaleString()}</div>
                <div className={styles.itemMeta}>{entry.descripcion}</div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <h3>Recetas recientes</h3>
          <div className={styles.timeline}>
            {recetasRecientes.length === 0 && <p className={styles.meta}>Sin recetas registradas.</p>}
            {recetasRecientes.map((receta) => (
              <div key={receta._id} className={styles.item}>
                <div className={styles.itemTitle}>{new Date(receta.fechaEmision).toLocaleDateString()}</div>
                <div className={styles.itemMeta}>{receta.medicamentos?.length || 0} medicamento(s)</div>
                <div className={styles.itemMeta}>
                  {(receta.medicamentos || []).slice(0, 2).map((m) => m.nombre).join(' | ') || '-'}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
