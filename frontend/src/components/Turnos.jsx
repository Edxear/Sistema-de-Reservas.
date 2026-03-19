import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getBookings, updateBooking } from '../services/bookingService';
import { crearPreferencia } from '../services/pagoService';
import Chat from './Chat';
import styles from './Dashboard.module.css';

const normalizarTexto = (valor = '') => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const formatDia = (fecha) => {
  const date = new Date(`${fecha}T00:00:00`);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date);
};

const horaAMinutos = (hora) => {
  const [hours, minutes] = hora.split(':').map(Number);
  return (hours * 60) + minutes;
};

const minutosAHora = (minutos) => {
  const hours = String(Math.floor(minutos / 60)).padStart(2, '0');
  const mins = String(minutos % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

const buildAvailableSlots = ({ doctor, fecha, duration, reservedBookings, excludeBookingId = '' }) => {
  if (!doctor || !fecha || !duration) return [];

  const dia = normalizarTexto(formatDia(fecha));
  const bloques = (doctor.horariosAtencion || []).filter((bloque) => normalizarTexto(bloque.dia) === dia);
  if (bloques.length === 0) return [];

  const bookedTimes = new Set(
    reservedBookings
      .filter((booking) => String(booking._id) !== String(excludeBookingId))
      .filter((booking) => ['pendiente', 'confirmada', 'reprogramada'].includes(booking.estado))
      .map((booking) => booking.hora)
  );

  const slots = [];
  for (const bloque of bloques) {
    const inicio = horaAMinutos(bloque.horaInicio);
    const fin = horaAMinutos(bloque.horaFin);

    for (let current = inicio; current + duration <= fin; current += duration) {
      const slot = minutosAHora(current);
      if (!bookedTimes.has(slot)) slots.push(slot);
    }
  }

  return slots;
};

export default function Turnos() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [chatPartner, setChatPartner] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState({
    open: false,
    bookingId: '',
    servicio: null,
    medico: null,
    fecha: '',
    hora: '',
    slots: [],
    loading: false,
  });
  const [filters, setFilters] = useState({ estado: '', page: 1, limit: 10 });
  const bookingsSectionRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  const getStatusClass = (estado) => {
    if (estado === 'confirmada') return styles.statusConfirmada;
    if (estado === 'cancelada') return styles.statusCancelada;
    if (estado === 'completada') return styles.statusCompletada;
    if (estado === 'atendida') return styles.statusAtendida;
    if (estado === 'ausente') return styles.statusAusente;
    if (estado === 'reprogramada') return styles.statusReprogramada;
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

  const handleBookingStatus = async (bookingId, estado) => {
    setStatusUpdatingId(bookingId);
    try {
      await updateBooking(bookingId, { estado });
      const estadoTexto = {
        confirmada: 'confirmada',
        cancelada: 'cancelada',
        atendida: 'marcada como atendida',
        ausente: 'marcada como ausente',
      };
      toast.success(`Consulta ${estadoTexto[estado] || 'actualizada'} correctamente`);
      await loadBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el estado de la consulta');
    } finally {
      setStatusUpdatingId('');
    }
  };

  useEffect(() => {
    const loadRescheduleAvailability = async () => {
      if (!rescheduleModal.open || !rescheduleModal.medico?._id || !rescheduleModal.fecha || !rescheduleModal.servicio?.duracion) {
        return;
      }

      setRescheduleModal((prev) => ({ ...prev, loading: true }));
      try {
        const res = await getBookings({ medico: rescheduleModal.medico._id, fecha: rescheduleModal.fecha, limit: 200, page: 1 });
        const slots = buildAvailableSlots({
          doctor: rescheduleModal.medico,
          fecha: rescheduleModal.fecha,
          duration: rescheduleModal.servicio.duracion,
          reservedBookings: res.data.bookings || [],
          excludeBookingId: rescheduleModal.bookingId,
        });
        setRescheduleModal((prev) => ({
          ...prev,
          slots,
          hora: slots.includes(prev.hora) ? prev.hora : '',
          loading: false,
        }));
      } catch (error) {
        toast.error(error.response?.data?.message || 'No se pudo consultar horarios para reprogramar');
        setRescheduleModal((prev) => ({ ...prev, slots: [], loading: false }));
      }
    };

    loadRescheduleAvailability();
  }, [rescheduleModal.open, rescheduleModal.medico, rescheduleModal.fecha, rescheduleModal.servicio, rescheduleModal.bookingId]);

  const openRescheduleModal = (booking) => {
    setRescheduleModal({
      open: true,
      bookingId: booking._id,
      servicio: booking.servicio,
      medico: booking.medico,
      fecha: String(booking.fecha).slice(0, 10),
      hora: booking.hora,
      slots: [],
      loading: false,
    });
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({
      open: false,
      bookingId: '',
      servicio: null,
      medico: null,
      fecha: '',
      hora: '',
      slots: [],
      loading: false,
    });
  };

  const submitReschedule = async () => {
    if (!rescheduleModal.fecha || !rescheduleModal.hora) {
      toast.error('Selecciona fecha y horario para reprogramar');
      return;
    }

    setModalLoading(true);
    try {
      await updateBooking(rescheduleModal.bookingId, {
        fecha: rescheduleModal.fecha,
        hora: rescheduleModal.hora,
        estado: 'reprogramada'
      });
      toast.success('Consulta reprogramada correctamente');
      closeRescheduleModal();
      await loadBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo reprogramar la consulta');
    } finally {
      setModalLoading(false);
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
            <option value="reprogramada">Reprogramada</option>
            <option value="ausente">Ausente</option>
            <option value="atendida">Atendida</option>
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
                  <div className={styles.bookingMeta}>Profesional: {b.medico?.nombre || '-'}</div>
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
                  {user?.rol === 'admin' && b.estado === 'pendiente' && (
                    <>
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleBookingStatus(b._id, 'confirmada')}
                        disabled={statusUpdatingId === b._id}
                      >
                        Confirmar consulta
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleBookingStatus(b._id, 'cancelada')}
                        disabled={statusUpdatingId === b._id}
                      >
                        Rechazar consulta
                      </button>
                    </>
                  )}
                  {user?.rol === 'admin' && ['confirmada', 'reprogramada'].includes(b.estado) && (
                    <>
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => openRescheduleModal(b)}
                        disabled={statusUpdatingId === b._id}
                      >
                        Reprogramar
                      </button>
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleBookingStatus(b._id, 'atendida')}
                        disabled={statusUpdatingId === b._id}
                      >
                        Marcar atendida
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleBookingStatus(b._id, 'ausente')}
                        disabled={statusUpdatingId === b._id}
                      >
                        Marcar ausente
                      </button>
                    </>
                  )}
                  {user?.rol === 'paciente' && ['pendiente', 'confirmada', 'reprogramada'].includes(b.estado) && (
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleBookingStatus(b._id, 'cancelada')}
                      disabled={statusUpdatingId === b._id}
                    >
                      Cancelar turno
                    </button>
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

      {rescheduleModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Reprogramar consulta</h3>
            <p className={styles.modalSub}>Profesional: {rescheduleModal.medico?.nombre || '-'}</p>

            <div className={styles.field}>
              <label>Nueva fecha</label>
              <input
                className={styles.input}
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={rescheduleModal.fecha}
                onChange={(e) => setRescheduleModal((prev) => ({ ...prev, fecha: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label>Nuevo horario</label>
              <select
                className={styles.select}
                value={rescheduleModal.hora}
                onChange={(e) => setRescheduleModal((prev) => ({ ...prev, hora: e.target.value }))}
                disabled={rescheduleModal.loading}
              >
                <option value="">{rescheduleModal.loading ? 'Consultando disponibilidad...' : 'Seleccionar horario'}</option>
                {rescheduleModal.slots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.secondaryBtn} onClick={closeRescheduleModal} disabled={modalLoading}>Cancelar</button>
              <button className={styles.primaryBtn} onClick={submitReschedule} disabled={modalLoading || rescheduleModal.loading}>
                {modalLoading ? 'Guardando...' : 'Confirmar reprogramación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {chatPartner && <Chat otroUsuario={chatPartner} onCerrar={() => setChatPartner(null)} />}
    </div>
  );
}
