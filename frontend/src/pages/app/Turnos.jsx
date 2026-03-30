import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getBookings, updateBooking } from '../../services/bookingService';
import { crearPreferencia } from '../../services/pagoService';
import { getDisponibilidad, getProximasFechas, getAgendaSemanal } from '../../services/disponibilidadService';
import Chat from '../../components/Chat';
import styles from './Dashboard.module.css';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

const normalizarTexto = (valor = '') => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const formatDia = (fecha) => {
  const date = new Date(`${fecha}T00:00:00`);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date);
};

export default function Turnos() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingIdFromQuery = new URLSearchParams(location.search).get('bookingId') || '';
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
    // Nuevos estados para API
    loadingFechas: false,
    rescheduleDateOptions: [],
    rescheduleScheduleByDay: new Map()
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

  useEffect(() => {
    if (!bookingIdFromQuery || loading || bookings.length === 0) return;
    const target = document.getElementById(`booking-${bookingIdFromQuery}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add(styles.bookingFocus);
      const t = setTimeout(() => target.classList.remove(styles.bookingFocus), 2200);
      return () => clearTimeout(t);
    }
  }, [bookingIdFromQuery, bookings, loading]);

  // Cargar fechas disponibles y agenda semanal cuando se abre el modal
  useEffect(() => {
    const loadScheduleData = async () => {
      if (!rescheduleModal.open || !rescheduleModal.medico?._id) {
        return;
      }

      setRescheduleModal((prev) => ({ ...prev, loadingFechas: true }));
      try {
        // Cargar próximas fechas disponibles
        const fechasRes = await getProximasFechas(rescheduleModal.medico._id, 45);
        const fechasOptions = fechasRes.fechas || [];

        // Cargar agenda semanal para mostrar rango de horarios
        const agendaRes = await getAgendaSemanal(rescheduleModal.medico._id);
        const agendaMap = new Map();
        const schedule = agendaRes.schedule || {};
        for (const [dia, horarios] of Object.entries(schedule)) {
          agendaMap.set(dia, horarios.map((h) => `${h.horaInicio} - ${h.horaFin}`));
        }

        // Seleccionar primera fecha disponible si no hay seleccionada
        const primeraFecha = fechasOptions[0]?.value || '';
        setRescheduleModal((prev) => ({
          ...prev,
          rescheduleDateOptions: fechasOptions,
          rescheduleScheduleByDay: agendaMap,
          fecha: primeraFecha,
          hora: '',
          loadingFechas: false
        }));
      } catch (error) {
        console.error('Error cargando datos de agenda:', error);
        toast.error('No se pudo cargar la agenda del médico');
        setRescheduleModal((prev) => ({
          ...prev,
          rescheduleDateOptions: [],
          rescheduleScheduleByDay: new Map(),
          loadingFechas: false
        }));
      }
    };

    loadScheduleData();
  }, [rescheduleModal.open, rescheduleModal.medico?._id]);

  // Validar fechas disponibles cuando cambia la lista
  useEffect(() => {
    if (!rescheduleModal.open) return;

    if (!rescheduleModal.rescheduleDateOptions.some((opt) => opt.value === rescheduleModal.fecha)) {
      setRescheduleModal((prev) => ({
        ...prev,
        fecha: rescheduleModal.rescheduleDateOptions[0]?.value || '',
        hora: ''
      }));
    }
  }, [rescheduleModal.open, rescheduleModal.rescheduleDateOptions, rescheduleModal.fecha]);

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
        // Obtener slots disponibles desde API
        const disponibilidadRes = await getDisponibilidad(
          rescheduleModal.medico._id,
          rescheduleModal.fecha,
          rescheduleModal.servicio.duracion
        );
        const slots = disponibilidadRes.slots || [];
        setRescheduleModal((prev) => ({
          ...prev,
          slots,
          hora: slots.includes(prev.hora) ? prev.hora : '',
          loading: false
        }));
      } catch (error) {
        console.error('Error obteniendo disponibilidad:', error);
        toast.error('No se pudo consultar horarios para reprogramar');
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
      loadingFechas: false,
      rescheduleDateOptions: [],
      rescheduleScheduleByDay: new Map()
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
      loadingFechas: false,
      rescheduleDateOptions: [],
      rescheduleScheduleByDay: new Map()
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
              <article key={b._id} id={`booking-${b._id}`} className={styles.bookingCard}>
                <div>
                  <div className={styles.bookingTitle}>{b.servicio?.nombre || 'Servicio'} - {b.hora}</div>
                  <div className={styles.bookingMeta}>{new Date(b.fecha).toLocaleDateString()} | ID {b._id.substring(0, 8)}...</div>
                  <div className={styles.bookingMeta}>Paciente: {b.usuario?.nombre || '-'}</div>
                  <div className={styles.bookingMeta}>Profesional: {b.medico?.nombre || '-'}{b.medico?.especialidad ? ` (${b.medico.especialidad})` : ''}</div>
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
                  {(['medico', 'admin', 'superadmin', 'secretaria', 'enfermero'].includes(user?.rol)) && b.usuario?._id && (
                    <>
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => {
                          sessionStorage.setItem(`scroll:${location.key || '/turnos'}`, String(window.scrollY));
                          navigate(`/historial/${b.usuario._id}`);
                        }}
                      >
                        Ver historial
                      </button>
                      {(['medico', 'admin', 'superadmin', 'enfermero'].includes(user?.rol)) && (
                        <button className={styles.secondaryBtn} onClick={() => setChatPartner({ _id: b.usuario._id, nombre: b.usuario.nombre || 'Paciente' })}>Chat</button>
                      )}
                    </>
                  )}
                  {(['admin', 'superadmin', 'secretaria', 'enfermero'].includes(user?.rol)) && b.estado === 'pendiente' && (
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
                  {(['admin', 'superadmin', 'secretaria', 'enfermero'].includes(user?.rol)) && ['confirmada', 'reprogramada'].includes(b.estado) && (
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
            <p className={styles.modalSub}>
              Profesional: {rescheduleModal.medico?.nombre || '-'}
              {rescheduleModal.medico?.especialidad ? ` (${rescheduleModal.medico.especialidad})` : ''}
            </p>

            {rescheduleModal.loadingFechas ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando agenda del médico...</p>
            ) : (
              <>
                <div className={styles.scheduleLegend}>
                  {WEEK_DAYS.map((day) => {
                    const ranges = rescheduleModal.rescheduleScheduleByDay.get(normalizarTexto(day)) || [];
                    const available = ranges.length > 0;
                    return (
                      <div key={day} className={`${styles.dayChip} ${available ? styles.dayAvailable : styles.dayUnavailable}`}>
                        <strong>{day}</strong>
                        <span>{available ? ranges.join(' | ') : 'No atiende'}</span>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.field}>
                  <label>Fechas disponibles del profesional</label>
                  <select
                    className={styles.select}
                    value={rescheduleModal.fecha}
                    onChange={(e) => setRescheduleModal((prev) => ({ ...prev, fecha: e.target.value }))}
                    disabled={rescheduleModal.rescheduleDateOptions.length === 0}
                  >
                    <option value="">Seleccionar fecha</option>
                    {rescheduleModal.rescheduleDateOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {rescheduleModal.rescheduleDateOptions.length === 0 && (
                    <small className={styles.helperTextError}>El profesional no tiene agenda configurada.</small>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Horario disponible (solo se muestran rangos activos)</label>
                  <select
                    className={styles.select}
                    value={rescheduleModal.hora}
                    onChange={(e) => setRescheduleModal((prev) => ({ ...prev, hora: e.target.value }))}
                    disabled={rescheduleModal.loading || !rescheduleModal.fecha}
                  >
                    <option value="">{rescheduleModal.loading ? 'Consultando disponibilidad...' : 'Seleccionar horario'}</option>
                    {rescheduleModal.slots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {!rescheduleModal.loading && rescheduleModal.fecha && rescheduleModal.slots.length === 0 && (
                    <small className={styles.helperTextError}>No hay horarios libres para la fecha elegida.</small>
                  )}
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.secondaryBtn} onClick={closeRescheduleModal} disabled={modalLoading}>Cancelar</button>
                  <button className={styles.primaryBtn} onClick={submitReschedule} disabled={modalLoading || rescheduleModal.loading}>
                    {modalLoading ? 'Guardando...' : 'Confirmar reprogramación'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {chatPartner && <Chat otroUsuario={chatPartner} onCerrar={() => setChatPartner(null)} />}
    </div>
  );
}

