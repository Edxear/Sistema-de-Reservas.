import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaFilter } from 'react-icons/fa';

// Importamos nuestro hook personalizado y los servicios
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../services/appointmentService';
import { getServices } from '../services/serviceService';
import { getBookings, createBooking, updateBooking } from '../services/bookingService';
import Chat from './Chat';
import { crearPreferencia } from '../services/pagoService';
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

const buildAvailableSlots = ({ doctor, fecha, duration, reservedBookings }) => {
  if (!doctor || !fecha || !duration) return [];

  const dia = normalizarTexto(formatDia(fecha));
  const bloques = (doctor.horariosAtencion || []).filter((bloque) => normalizarTexto(bloque.dia) === dia);
  if (bloques.length === 0) return [];

  const bookedTimes = new Set(
    reservedBookings
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
  const [chatPartner, setChatPartner] = useState(null); // { _id, nombre }

  const inferirEspecialidadPorServicio = useCallback((serviceName = '') => {
    const n = serviceName.toLowerCase();
    if (n.includes('neurolog')) return 'neurologia';
    if (n.includes('traumatolog') || n.includes('osteo')) return 'traumatologia';
    if (n.includes('pediatr')) return 'pediatria';
    if (n.includes('cardiolog')) return 'cardiologia';
    if (n.includes('clinica')) return 'clinica medica';
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

  const handleBookingStatus = async (bookingId, estado) => {
    setStatusUpdatingId(bookingId);
    try {
      await updateBooking(bookingId, { estado });
      toast.success(`Consulta ${estado === 'confirmada' ? 'confirmada' : 'rechazada'} correctamente`);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el estado de la consulta');
    } finally {
      setStatusUpdatingId('');
    }
  };

  const handleReschedule = async (booking) => {
    const nuevaFecha = window.prompt('Nueva fecha del turno (YYYY-MM-DD)', String(booking.fecha).slice(0, 10));
    if (!nuevaFecha) return;

    const nuevaHora = window.prompt('Nueva hora del turno (HH:mm)', booking.hora);
    if (!nuevaHora) return;

    setStatusUpdatingId(booking._id);
    try {
      await updateBooking(booking._id, { fecha: nuevaFecha, hora: nuevaHora, estado: 'reprogramada' });
      toast.success('Consulta reprogramada correctamente');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo reprogramar la consulta');
    } finally {
      setStatusUpdatingId('');
    }
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cargando datos');
      
      if (error.response?.status === 401) {
        logout();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, logout, navigate]); // Dependencias: filters, logout, navigate

  // Efecto para cargar datos al montar el componente o cuando cambian los filtros
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate, filters, loadData]);

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
            <option value="completada">Completada</option>
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
                  {(user?.rol === 'medico' || user?.rol === 'admin') && (
                    <>
                      <button className={styles.secondaryBtn} onClick={() => navigate(`/historial/${b.usuario?._id}`)}>Ver historial</button>
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
                        onClick={() => handleReschedule(b)}
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
          <p>Area reservada para configurar servicios, doctores y reglas globales del consultorio.</p>
        </section>
      )}

      {chatPartner && <Chat otroUsuario={chatPartner} onCerrar={() => setChatPartner(null)} />}
    </div>
  );
}