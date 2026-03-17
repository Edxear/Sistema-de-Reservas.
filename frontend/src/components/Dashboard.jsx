import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaFilter } from 'react-icons/fa';

// Importamos nuestro hook personalizado y los servicios
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../services/appointmentService';
import { getServices } from '../services/serviceService';
import { getBookings, createBooking } from '../services/bookingService';
import Chat from './Chat';
import { crearPreferencia } from '../services/pagoService';
import styles from './Dashboard.module.css';

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
    fecha: '',
    hora: '',
    notas: '',
  });
  const [loading, setLoading] = useState(false);
  const [chatPartner, setChatPartner] = useState(null); // { _id, nombre }

  const getStatusClass = (estado) => {
    if (estado === 'confirmada') return styles.statusConfirmada;
    if (estado === 'cancelada') return styles.statusCancelada;
    if (estado === 'completada') return styles.statusCompletada;
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
      // Asumimos que la respuesta es { bookings: [], totalPages: ... }
      setBookings(bookingsRes.data.bookings || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cargando datos');
      // Si el error es de autenticación (401), cerramos sesión
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
        fecha: bookingData.fecha,
        hora: bookingData.hora,
        fechaHoraReserva: new Date().toISOString(),
        notas: bookingData.notas,
      });

      toast.success('Reserva creada');
      // Limpiar el formulario
      setBookingData({ servicio: '', fecha: '', hora: '', notas: '' });
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
                value={bookingData.doctor || ''}
                onChange={(e) => setBookingData({ ...bookingData, doctor: e.target.value })}
              >
                <option value="">Seleccionar doctor</option>
                {doctors.length === 0 && (
                  <option value="" disabled>No hay doctores disponibles</option>
                )}
                {doctors.map((d) => (
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
                onChange={(e) => setBookingData({ ...bookingData, fecha: e.target.value })}
                required
              />
            </div>

            <div className={styles.field}>
              <label>Hora</label>
              <input
                className={styles.input}
                type="time"
                value={bookingData.hora}
                onChange={(e) => setBookingData({ ...bookingData, hora: e.target.value })}
                required
              />
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
                  <div className={styles.bookingMeta}>Notas: {b.notas || '-'}</div>
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