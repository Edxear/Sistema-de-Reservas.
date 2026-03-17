import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getBookings } from '../services/bookingService';
import { crearPreferencia } from '../services/pagoService';
import Chat from './Chat';
import styles from './Dashboard.module.css';

export default function Turnos() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [chatPartner, setChatPartner] = useState(null);
  const [filters, setFilters] = useState({ estado: '', page: 1, limit: 10 });
  const bookingsSectionRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  const getStatusClass = (estado) => {
    if (estado === 'confirmada') return styles.statusConfirmada;
    if (estado === 'cancelada') return styles.statusCancelada;
    if (estado === 'completada') return styles.statusCompletada;
    return styles.statusPendiente;
  };

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBookings(filters);
      setBookings(res.data.bookings || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cargando turnos');
      if (error.response?.status === 401) {
        logout();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, logout, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadBookings();
  }, [isAuthenticated, loadBookings, navigate]);

  useEffect(() => {
    if (filters.page > 1) {
      bookingsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [filters.page]);

  const goToPage = (newPage) => {
    setFilters((prev) => ({ ...prev, page: Math.min(Math.max(1, newPage), totalPages) }));
  };

  const handlePagar = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await crearPreferencia(bookingId, config);
      window.location.href = res.data.init_point;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar el pago');
    }
  };

  if (!user) return <div>Cargando sesión...</div>;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}><FaCalendarAlt /> Turnos</h1>
          <p className={styles.heroSub}>Consulta y gestiona tus reservas desde una sola vista.</p>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}><FaFilter /> Filtros</h2>
        <div className={styles.filtersRow}>
          <select
            className={styles.select}
            value={filters.estado}
            onChange={(e) => setFilters((prev) => ({ ...prev, estado: e.target.value, page: 1 }))}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
            <option value="completada">Completada</option>
          </select>
          <button
            className={styles.smallBtn}
            onClick={() => goToPage(filters.page - 1)}
            disabled={filters.page <= 1 || loading}
          >
            Anterior
          </button>
          <span>Pagina {filters.page} de {totalPages}</span>
          <button
            className={styles.smallBtn}
            onClick={() => goToPage(filters.page + 1)}
            disabled={filters.page >= totalPages || loading}
          >
            Siguiente
          </button>
        </div>
      </section>

      <section className={styles.card} ref={bookingsSectionRef}>
        <h2 className={styles.cardTitle}>Listado de turnos</h2>
        {loading && <p>Cargando turnos...</p>}
        {!loading && bookings.length === 0 ? (
          <p>No hay turnos para mostrar.</p>
        ) : (
          <div className={styles.bookingsList}>
            {bookings.map((b) => (
              <article key={b._id} className={styles.bookingCard}>
                <div>
                  <div className={styles.bookingTitle}>{b.servicio?.nombre || 'Servicio'} - {b.hora}</div>
                  <div className={styles.bookingMeta}>{new Date(b.fecha).toLocaleDateString()} | ID {b._id.substring(0, 8)}...</div>
                  <div className={styles.bookingMeta}>Paciente: {b.usuario?.nombre || '-'}</div>
                  <div className={styles.bookingMeta}>Notas: {b.notas || '-'}</div>
                  {b.estado === 'confirmada' && (
                    <div className={styles.bookingMeta}>
                      {b.historial?.cantidadRegistros > 0
                        ? `Historial: ${b.historial.cantidadRegistros} registro(s).`
                        : 'Historial: paciente sin historial clínico registrado.'}
                    </div>
                  )}
                  {b.estado === 'confirmada' && b.historial?.atenciones?.length > 0 && (
                    <ul className={styles.historialList}>
                      {b.historial.atenciones.map((h, idx) => (
                        <li key={`${b._id}-hist-${idx}`}>
                          {new Date(h.fecha).toLocaleDateString()} - {h.tratamiento}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <span className={`${styles.statusChip} ${getStatusClass(b.estado)}`}>{b.estado}</span>
                </div>

                <div className={styles.actions}>
                  {(user?.rol === 'medico' || user?.rol === 'admin') && b.usuario?._id && (
                    <>
                      <button className={styles.secondaryBtn} onClick={() => navigate(`/historial/${b.usuario._id}`)}>Ver historial</button>
                      <button className={styles.secondaryBtn} onClick={() => setChatPartner({ _id: b.usuario._id, nombre: b.usuario.nombre || 'Paciente' })}>Chat</button>
                    </>
                  )}
                  {user?.rol === 'paciente' && b.estado === 'pendiente' && (
                    <button className={styles.primaryBtn} onClick={() => handlePagar(b._id)}>Pagar</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {chatPartner && <Chat otroUsuario={chatPartner} onCerrar={() => setChatPartner(null)} />}
    </div>
  );
}
