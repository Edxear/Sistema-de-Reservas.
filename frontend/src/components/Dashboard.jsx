import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { jsPDF } from 'jspdf';

// Importamos nuestro hook personalizado y los servicios
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../services/appointmentService';
import { getServices } from '../services/serviceService';
import { getBookings, createBooking, updateBooking, getBookingMetrics, getPatientSummaries } from '../services/bookingService';
import Chat from './Chat';
import { crearPreferencia } from '../services/pagoService';
import styles from './Dashboard.module.css';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

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
      if (!bookedTimes.has(slot)) {
        slots.push(slot);
      }
    }
  }

  return slots;
};

const getScheduleByDay = (horarios = []) => {
  const map = new Map();
  for (const day of WEEK_DAYS) map.set(normalizarTexto(day), []);

  horarios.forEach((bloque) => {
    const key = normalizarTexto(bloque.dia);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(`${bloque.horaInicio} - ${bloque.horaFin}`);
  });

  return map;
};

const getNextAvailableDates = (horarios = [], daysAhead = 30) => {
  const availableDays = new Set(horarios.map((bloque) => normalizarTexto(bloque.dia)));
  const options = [];

  for (let i = 0; i < daysAhead; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    const weekday = normalizarTexto(new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date));
    if (availableDays.has(weekday)) {
      options.push({
        value: iso,
        label: `${date.toLocaleDateString('es-AR')} (${new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date)})`
      });
    }
  }

  return options;
};

export default function Dashboard() {
  const navigate = useNavigate();
  // Obtenemos el usuario y la función de logout del contexto
  const { user, logout, isAuthenticated } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({ estado: '', page: 1, limit: 10 });
  const [bookingData, setBookingData] = useState({
    servicio: '',
    medico: '',
    fecha: '',
    hora: '',
    notas: '',
  });
  const [loading, setLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [metricsPeriod, setMetricsPeriod] = useState('7d');
  const [patientSummaries, setPatientSummaries] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
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
  const [chatPartner, setChatPartner] = useState(null); // { _id, nombre }

  const inferirEspecialidadPorServicio = useCallback((serviceName = '') => {
    const n = serviceName.toLowerCase();
    if (n.includes('neurolog')) return 'neurologia';
    if (n.includes('traumatolog') || n.includes('osteo')) return 'traumatologia';
    if (n.includes('pediatr')) return 'pediatria';
    if (n.includes('clinica medica')) return 'clinica medica';
    return '';
  }, []);

  const servicioSeleccionado = services.find((s) => s._id === bookingData.servicio);
  const doctorSeleccionado = doctors.find((d) => d._id === bookingData.medico);
  const especialidadRequerida = inferirEspecialidadPorServicio(servicioSeleccionado?.nombre || '');

  const doctorsFiltrados = doctors.filter((d) => {
    if (!especialidadRequerida) return true;
    const especialidadDoctor = (d.especialidad || d.specialty || '').toLowerCase();
    return especialidadDoctor.includes(especialidadRequerida);
  });

  useEffect(() => {
    if (bookingData.medico && !doctorsFiltrados.some((doctor) => doctor._id === bookingData.medico)) {
      setBookingData((prev) => ({ ...prev, medico: '', hora: '' }));
      setAvailableSlots([]);
    }
  }, [bookingData.medico, doctorsFiltrados]);

  const getStatusClass = (estado) => {
    if (estado === 'confirmada') return styles.statusConfirmada;
    if (estado === 'cancelada') return styles.statusCancelada;
    if (estado === 'completada') return styles.statusCompletada;
    if (estado === 'atendida') return styles.statusAtendida;
    if (estado === 'ausente') return styles.statusAusente;
    if (estado === 'reprogramada') return styles.statusReprogramada;
    return styles.statusPendiente;
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

  useEffect(() => {
    const loadAvailability = async () => {
      if (!bookingData.medico || !bookingData.fecha || !servicioSeleccionado) {
        setAvailableSlots([]);
        return;
      }

      setAvailabilityLoading(true);
      try {
        const res = await getBookings({ medico: bookingData.medico, fecha: bookingData.fecha, limit: 200, page: 1 });
        const slots = buildAvailableSlots({
          doctor: doctorSeleccionado,
          fecha: bookingData.fecha,
          duration: servicioSeleccionado.duracion,
          reservedBookings: res.data.bookings || [],
        });
        setAvailableSlots(slots);
        if (bookingData.hora && !slots.includes(bookingData.hora)) {
          setBookingData((prev) => ({ ...prev, hora: '' }));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'No se pudo calcular la disponibilidad del profesional');
        setAvailableSlots([]);
      } finally {
        setAvailabilityLoading(false);
      }
    };

    loadAvailability();
  }, [bookingData.medico, bookingData.fecha, bookingData.hora, servicioSeleccionado, doctorSeleccionado]);

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
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el estado de la consulta');
    } finally {
      setStatusUpdatingId('');
    }
  };

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
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo reprogramar la consulta');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredSummaries = patientSummaries.filter((summary) => {
    if (!patientSearch.trim()) return true;
    const search = patientSearch.toLowerCase();
    return [summary.nombre, summary.email, summary.obraSocial, summary.numeroAfiliado]
      .some((value) => (value || '').toLowerCase().includes(search));
  });

  const statusChartRows = [
    { key: 'pendiente', label: 'Pendientes', value: adminMetrics?.byEstado?.pendiente ?? 0 },
    { key: 'confirmada', label: 'Confirmadas', value: adminMetrics?.byEstado?.confirmada ?? 0 },
    { key: 'reprogramada', label: 'Reprogramadas', value: adminMetrics?.byEstado?.reprogramada ?? 0 },
    { key: 'atendida', label: 'Atendidas', value: adminMetrics?.byEstado?.atendida ?? 0 },
    { key: 'ausente', label: 'Ausentes', value: adminMetrics?.byEstado?.ausente ?? 0 },
    { key: 'cancelada', label: 'Canceladas', value: adminMetrics?.byEstado?.cancelada ?? 0 },
  ];
  const maxStatusValue = Math.max(1, ...statusChartRows.map((row) => row.value));
  const maxTrendValue = Math.max(1, ...(adminMetrics?.trend || []).map((item) => item.total));
  const rescheduleDateOptions = getNextAvailableDates(rescheduleModal.medico?.horariosAtencion || [], 45);
  const rescheduleScheduleByDay = getScheduleByDay(rescheduleModal.medico?.horariosAtencion || []);

  useEffect(() => {
    if (!rescheduleModal.open) return;

    if (!rescheduleDateOptions.some((opt) => opt.value === rescheduleModal.fecha)) {
      setRescheduleModal((prev) => ({
        ...prev,
        fecha: rescheduleDateOptions[0]?.value || '',
        hora: ''
      }));
    }
  }, [rescheduleModal.open, rescheduleDateOptions, rescheduleModal.fecha]);

  const exportPatientCSV = () => {
    if (!patientSummaries.length) {
      toast.info('No hay pacientes para exportar');
      return;
    }

    const header = ['Nombre', 'Email', 'Telefono', 'Obra Social', 'Afiliado', 'Alergias', 'Total Turnos', 'Proximos Turnos'];
    const lines = patientSummaries.map((p) => [
      p.nombre,
      p.email,
      p.telefono,
      p.obraSocial,
      p.numeroAfiliado,
      p.alergias,
      p.totalTurnos,
      p.proximosTurnos,
    ]);

    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte_pacientes.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportMetricsPDF = () => {
    if (!adminMetrics) {
      toast.info('No hay metricas para exportar');
      return;
    }

    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('Reporte de Consultas', 14, 18);
    pdf.setFontSize(11);
    pdf.text(`Periodo: ${metricsPeriod}`, 14, 28);
    pdf.text(`Total turnos: ${adminMetrics.total}`, 14, 36);
    pdf.text(`Turnos hoy: ${adminMetrics.todayTotal}`, 14, 43);

    let y = 54;
    statusChartRows.forEach((row) => {
      pdf.text(`${row.label}: ${row.value}`, 14, y);
      y += 7;
    });

    pdf.save(`reporte_consultas_${metricsPeriod}.pdf`);
  };

  // Función para cargar todos los datos (doctores, servicios, reservas)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargamos doctores y servicios en paralelo para optimizar
      const [docs, srv] = await Promise.all([getDoctors(), getServices()]);
      setDoctors(docs);
      setServices(srv);

      // Cargamos las reservas con los filtros
      const bookingsRes = await getBookings(filters);

      setBookings(bookingsRes.data.bookings || []);

      if (user?.rol === 'admin') {
        const [metricsRes, patientRes] = await Promise.all([
          getBookingMetrics(metricsPeriod),
          getPatientSummaries(),
        ]);
        setAdminMetrics(metricsRes.data || null);
        setPatientSummaries(patientRes.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cargando datos');
      
      if (error.response?.status === 401) {
        logout();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, logout, navigate, user?.rol, metricsPeriod]); // Dependencias: filters, logout, navigate

  // Efecto para cargar datos al montar el componente o cuando cambian los filtros
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate, filters, loadData]);

  useEffect(() => {
    const saved = sessionStorage.getItem('scroll:dashboard');
    if (!saved) return;
    const y = Number(saved);
    if (!Number.isNaN(y)) {
      requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'auto' }));
    }
    sessionStorage.removeItem('scroll:dashboard');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNewBooking = async (e) => {
    e.preventDefault();
    if (!bookingData.servicio || !bookingData.fecha || !bookingData.hora) {
      toast.error('Complete todos los datos de reserva');
      return;
    }

    setLoading(true);
    try {
      await createBooking({
        usuario: user?.id, // El backend espera el ID del usuario
        servicio: bookingData.servicio,
        medico: bookingData.medico,
        fecha: bookingData.fecha,
        hora: bookingData.hora,
        fechaHoraReserva: new Date().toISOString(),
        notas: bookingData.notas,
      });

      toast.success('Reserva creada');
      // Limpiar el formulario
      setBookingData({ servicio: '', medico: '', fecha: '', hora: '', notas: '' });
      setAvailableSlots([]);
      // Recargar la lista de reservas
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creando reserva');
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar de página
  const goToPage = (newPage) => {
    setFilters((prev) => ({ ...prev, page: Math.max(1, newPage) }));
  };

  // --- RENDERIZADO ---
  if (!user) {
    return <div>Cargando sesión...</div>; // O un spinner
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Bienvenido, {user?.nombre || user?.name || 'Profesional'}</h1>
          <p className={styles.heroSub}>Gestiona tus turnos y seguimiento clinico de forma centralizada.</p>
        </div>
        <button onClick={handleLogout} disabled={loading} className={styles.secondaryBtn}>
          Cerrar sesion
        </button>
      </section>

      {(user?.rol === 'medico' || user?.rol === 'admin') && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Accesos rapidos</h2>
          <div className={styles.actions}>
            <button onClick={() => navigate('/recetas')} className={styles.secondaryBtn}>Ir a Recetas</button>
          </div>
        </section>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}><FaCalendarAlt /> Crear nueva reserva</h2>
        <form onSubmit={handleNewBooking}>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Servicio</label>
              <select
                className={styles.select}
                value={bookingData.servicio}
                onChange={(e) => setBookingData({ ...bookingData, servicio: e.target.value })}
                required
              >
                <option value="">Seleccionar servicio</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.nombre} ({s.duracion} min)
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Doctor</label>
              <select
                className={styles.select}
                value={bookingData.medico}
                onChange={(e) => setBookingData({ ...bookingData, medico: e.target.value, hora: '' })}
                required
              >
                <option value="">Seleccionar doctor</option>
                {doctors.length === 0 && (
                  <option value="" disabled>No hay doctores disponibles</option>
                )}
                {doctors.length > 0 && doctorsFiltrados.length === 0 && (
                  <option value="" disabled>No hay doctores para esta especialidad</option>
                )}
                {doctorsFiltrados.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.nombre || d.name} {d.especialidad || d.specialty ? `- ${d.especialidad || d.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Fecha</label>
              <input
                className={styles.input}
                type="date"
                value={bookingData.fecha}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setBookingData({ ...bookingData, fecha: e.target.value, hora: '' })}
                required
              />
            </div>

            <div className={styles.field}>
              <label>Hora</label>
              <select
                className={styles.select}
                value={bookingData.hora}
                onChange={(e) => setBookingData({ ...bookingData, hora: e.target.value })}
                disabled={!bookingData.medico || !bookingData.fecha || !bookingData.servicio || availabilityLoading}
                required
              >
                <option value="">
                  {availabilityLoading ? 'Consultando disponibilidad...' : 'Seleccionar horario'}
                </option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              {!availabilityLoading && bookingData.medico && bookingData.fecha && bookingData.servicio && availableSlots.length === 0 && (
                <small className={styles.helperText}>No hay horarios disponibles para ese profesional en la fecha elegida.</small>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label>Notas</label>
            <textarea
              className={styles.textarea}
              placeholder="Notas adicionales"
              value={bookingData.notas}
              onChange={(e) => setBookingData({ ...bookingData, notas: e.target.value })}
            />
          </div>

          <div className={styles.submitRow}>
            <button type="submit" disabled={loading} className={styles.primaryBtn}>
              {loading ? 'Creando...' : 'Crear Reserva'}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}><FaFilter /> Filtros</h2>
        <div className={styles.filtersRow}>
          <select
            className={styles.select}
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value, page: 1 })}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
            <option value="reprogramada">Reprogramada</option>
            <option value="ausente">Ausente</option>
            <option value="atendida">Atendida</option>
          </select>
          <button className={styles.smallBtn} onClick={() => goToPage(filters.page - 1)} disabled={filters.page <= 1 || loading}>Anterior</button>
          <span>Pagina {filters.page}</span>
          <button className={styles.smallBtn} onClick={() => goToPage(filters.page + 1)} disabled={loading}>Siguiente</button>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Reservas</h2>
        {loading && <p>Cargando reservas...</p>}
        {!loading && bookings.length === 0 ? (
          <p>No hay reservas para mostrar.</p>
        ) : (
          <div className={styles.bookingsList}>
            {bookings.map((b) => (
              <article key={b._id} className={styles.bookingCard}>
                <div>
                  <div className={styles.bookingTitle}>{b.servicio?.nombre || 'Servicio'} - {b.hora}</div>
                  <div className={styles.bookingMeta}>{new Date(b.fecha).toLocaleDateString()} | ID {b._id.substring(0, 8)}...</div>
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
                  {(user?.rol === 'medico' || user?.rol === 'admin') && (
                    <>
                      <button className={styles.secondaryBtn} onClick={() => {
                        sessionStorage.setItem('scroll:dashboard', String(window.scrollY));
                        navigate(`/historial/${b.usuario?._id}`);
                      }}>Ver historial</button>
                      {b.usuario?._id && (
                        <button className={styles.secondaryBtn} onClick={() => setChatPartner({ _id: b.usuario._id, nombre: b.usuario.nombre || 'Paciente' })}>Chat</button>
                      )}
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

      {user?.rol === 'admin' && (
        <section className={styles.adminBox}>
          <h2>Panel de Administracion</h2>
          <p>Panel operativo con metricas y buscador rapido de pacientes.</p>

          <div className={styles.metricsGrid}>
            <article className={styles.metricCard}><span>Total turnos</span><strong>{adminMetrics?.total ?? '-'}</strong></article>
            <article className={styles.metricCard}><span>Turnos hoy</span><strong>{adminMetrics?.todayTotal ?? '-'}</strong></article>
            <article className={styles.metricCard}><span>Pendientes</span><strong>{adminMetrics?.byEstado?.pendiente ?? '-'}</strong></article>
            <article className={styles.metricCard}><span>Confirmados</span><strong>{adminMetrics?.byEstado?.confirmada ?? '-'}</strong></article>
            <article className={styles.metricCard}><span>Atendidos</span><strong>{adminMetrics?.byEstado?.atendida ?? '-'}</strong></article>
            <article className={styles.metricCard}><span>Ausentes</span><strong>{adminMetrics?.byEstado?.ausente ?? '-'}</strong></article>
          </div>

          <div className={styles.metricsControls}>
            <div className={styles.field}>
              <label>Periodo</label>
              <select className={styles.select} value={metricsPeriod} onChange={(e) => setMetricsPeriod(e.target.value)}>
                <option value="today">Hoy</option>
                <option value="7d">Ultimos 7 dias</option>
                <option value="30d">Ultimos 30 dias</option>
              </select>
            </div>
            <div className={styles.actions}>
              <button className={styles.secondaryBtn} onClick={exportMetricsPDF}>Exportar metricas PDF</button>
              <button className={styles.secondaryBtn} onClick={exportPatientCSV}>Exportar pacientes CSV</button>
            </div>
          </div>

          <div className={styles.chartBox}>
            <h3>Estado de consultas</h3>
            <div className={styles.chartRows}>
              {statusChartRows.map((row) => (
                <div className={styles.chartRow} key={row.key}>
                  <span className={styles.chartLabel}>{row.label}</span>
                  <div className={styles.chartBarTrack}>
                    <div className={styles.chartBarFill} style={{ width: `${(row.value / maxStatusValue) * 100}%` }} />
                  </div>
                  <span className={styles.chartValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.chartBox}>
            <h3>Tendencia de consultas</h3>
            <div className={styles.chartRows}>
              {(adminMetrics?.trend || []).map((row) => (
                <div className={styles.chartRow} key={row.label}>
                  <span className={styles.chartLabel}>{row.label}</span>
                  <div className={styles.chartBarTrack}>
                    <div className={styles.chartBarFill} style={{ width: `${(row.total / maxTrendValue) * 100}%` }} />
                  </div>
                  <span className={styles.chartValue}>{row.total}</span>
                </div>
              ))}
              {(adminMetrics?.trend || []).length === 0 && <p className={styles.chartEmpty}>Sin datos para el periodo seleccionado.</p>}
            </div>
          </div>

          <div className={styles.patientSearchBox}>
            <h3>Buscador rápido de pacientes</h3>
            <input
              className={styles.input}
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Buscar por nombre, email, obra social o afiliado"
            />

            <div className={styles.patientList}>
              {filteredSummaries.slice(0, 8).map((summary) => (
                <article key={summary.pacienteId} className={styles.patientCard}>
                  <div className={styles.patientTitle}>{summary.nombre}</div>
                  <div className={styles.patientMeta}>{summary.email || 'Sin email'} | {summary.telefono || 'Sin telefono'}</div>
                  <div className={styles.patientMeta}>Obra social: {summary.obraSocial || '-'} | Afiliado: {summary.numeroAfiliado || '-'}</div>
                  <div className={styles.patientMeta}>Alergias: {summary.alergias || 'No registradas'}</div>
                  <div className={styles.patientMeta}>Turnos totales: {summary.totalTurnos} | Próximos: {summary.proximosTurnos}</div>
                  <div className={styles.patientMeta}>
                    Ultimo turno: {summary.ultimoTurno ? `${new Date(summary.ultimoTurno.fecha).toLocaleDateString()} - ${summary.ultimoTurno.servicio}` : 'Sin turnos atendidos'}
                  </div>
                  <div className={styles.patientMeta}>
                    Proximo turno: {summary.proximoTurno ? `${new Date(summary.proximoTurno.fecha).toLocaleDateString()} ${summary.proximoTurno.hora} - ${summary.proximoTurno.servicio}` : 'Sin turnos futuros'}
                  </div>
                  <div className={styles.patientActions}>
                    <button className={styles.secondaryBtn} onClick={() => navigate(`/pacientes/${summary.pacienteId}`)}>
                      Ver ficha completa
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => navigate(`/recetas?pacienteId=${summary.pacienteId}`)}>
                      Crear receta
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {rescheduleModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Reprogramar consulta</h3>
            <p className={styles.modalSub}>
              Profesional: {rescheduleModal.medico?.nombre || '-'}
              {rescheduleModal.medico?.especialidad ? ` (${rescheduleModal.medico.especialidad})` : ''}
            </p>

            <div className={styles.scheduleLegend}>
              {WEEK_DAYS.map((day) => {
                const ranges = rescheduleScheduleByDay.get(normalizarTexto(day)) || [];
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
                disabled={rescheduleDateOptions.length === 0}
              >
                <option value="">Seleccionar fecha</option>
                {rescheduleDateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {rescheduleDateOptions.length === 0 && (
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
          </div>
        </div>
      )}

      {chatPartner && <Chat otroUsuario={chatPartner} onCerrar={() => setChatPartner(null)} />}
    </div>
  );
}