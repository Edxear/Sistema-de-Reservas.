import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Importamos nuestro hook personalizado y los servicios
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../services/appointmentService';
import { getServices } from '../services/serviceService';
import { getBookings, createBooking } from '../services/bookingService';

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
    <div style={{ maxWidth: 1200, margin: '20px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Bienvenido {user?.nombre || user?.name || 'Usuario'}</h1>
        <button onClick={handleLogout} disabled={loading}>
          Cerrar sesión
        </button>
      </div>
      <p>Rol: {user?.rol || 'usuario'}</p>
      {(user?.rol === 'medico' || user?.rol === 'admin') && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => navigate('/recetas')} style={{ marginRight: 10 }}>
            Ir a Recetas
          </button>
          <button onClick={() => navigate('/historial/')} disabled>
            Ver Historia Clínica (seleccionar paciente)
          </button>
        </div>
      )}

      {/* Formulario para crear reserva */}
      <section style={{ marginBottom: 30, border: '1px solid #ccc', padding: 20, borderRadius: 8 }}>
        <h2>Crear nueva reserva</h2>
        <form onSubmit={handleNewBooking} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <select
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

            {/* Select de doctores (si es necesario) */}
            <select
              value={bookingData.doctor}
              onChange={(e) => setBookingData({ ...bookingData, doctor: e.target.value })}
            >
              <option value="">Seleccionar doctor (opcional)</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.nombre}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={bookingData.fecha}
              onChange={(e) => setBookingData({ ...bookingData, fecha: e.target.value })}
              required
            />
            <input
              type="time"
              value={bookingData.hora}
              onChange={(e) => setBookingData({ ...bookingData, hora: e.target.value })}
              required
            />
          </div>
          <textarea
            placeholder="Notas adicionales"
            value={bookingData.notas}
            onChange={(e) => setBookingData({ ...bookingData, notas: e.target.value })}
            rows="3"
          />
          <button type="submit" disabled={loading} style={{ width: 200 }}>
            {loading ? 'Creando...' : 'Crear Reserva'}
          </button>
        </form>
      </section>

      {/* Filtros y paginación */}
      <section style={{ marginBottom: 20 }}>
        <h2>Filtros de reservas</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value, page: 1 })}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
            <option value="completada">Completada</option>
          </select>
          <button onClick={() => goToPage(filters.page - 1)} disabled={filters.page <= 1 || loading}>
            Anterior
          </button>
          <span>Página {filters.page}</span>
          <button onClick={() => goToPage(filters.page + 1)} disabled={loading}>
            Siguiente
          </button>
        </div>
      </section>

      {/* Listado de reservas */}
      <section>
        <h2>Mis reservas</h2>
        {loading && <p>Cargando reservas...</p>}
        {!loading && bookings.length === 0 ? (
          <p>No hay reservas para mostrar.</p>
        ) : (
          <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Notas</th>
                {(user?.rol === 'medico' || user?.rol === 'admin') && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b._id.substring(0, 8)}...</td>
                  <td>{b.servicio?.nombre || 'N/A'}</td>
                  <td>{new Date(b.fecha).toLocaleDateString()}</td>
                  <td>{b.hora}</td>
                  <td>{b.estado}</td>
                  <td>{b.notas || '-'}</td>
                  {(user?.rol === 'medico' || user?.rol === 'admin') && (
                    <td>
                      <button onClick={() => navigate(`/historial/${b.usuario?._id}`)}>
                        Ver historial
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Sección de admin */}
      {user?.rol === 'admin' && (
        <section style={{ marginTop: 30 }}>
          <h2>Panel de Administración</h2>
          <p>Aquí puedes agregar funcionalidades para gestionar servicios, doctores y todas las reservas.</p>
          {/* Aquí irían los botones/links para gestionar el sistema */}
        </section>
      )}
    </div>
  );
}