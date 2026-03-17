import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDoctors } from '../services/appointmentService';
import { getServices } from '../services/serviceService';
import { getBookings, createBooking } from '../services/bookingService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [token] = useState(localStorage.getItem('token') || '');

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({ estado: '', page: 1, limit: 10 });
  const [bookingData, setBookingData] = useState({ usuario: '', servicio: '', fecha: '', hora: '', fechaHoraReserva: '', notas: '' });

  const loadData = async () => {
    try {
      const docs = await getDoctors();
      setDoctors(docs);
      const srv = await getServices();
      setServices(srv);

      const q = new URLSearchParams(filters).toString();
      const res = await getBookings({ params: filters, headers: { Authorization: `Bearer ${token}` } });
      setBookings(res.data.bookings);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cargando datos');
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadData();
  }, [token, filters, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleNewBooking = async (e) => {
    e.preventDefault();
    if (!bookingData.servicio || !bookingData.fecha || !bookingData.hora) {
      toast.error('Complete todos los datos de reserva');
      return;
    }
    try {
      await createBooking(
        {
          usuario: user?.id,
          servicio: bookingData.servicio,
          fecha: bookingData.fecha,
          hora: bookingData.hora,
          fechaHoraReserva: new Date().toISOString(),
          notas: bookingData.notas,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Reserva creada');
      setBookingData({ usuario: '', servicio: '', fecha: '', hora: '', fechaHoraReserva: '', notas: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creando reserva');
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Bienvenido {user?.nombre || user?.name}</h1>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
      <p>Rol: {user?.rol || 'usuario'}</p>

      <section style={{ marginBottom: 20 }}>
        <h2>Crear reserva</h2>
        <form onSubmit={handleNewBooking} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <select value={bookingData.servicio} onChange={(e) => setBookingData({ ...bookingData, servicio: e.target.value })}>
            <option value="">Seleccionar servicio</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>{s.nombre} ({s.duracion} min)</option>
            ))}
          </select>
          <select value={bookingData.usuario} disabled>
            <option value={user?.id}>Tu usuario</option>
          </select>
          <input type="date" value={bookingData.fecha} onChange={(e) => setBookingData({ ...bookingData, fecha: e.target.value })} />
          <input type="time" value={bookingData.hora} onChange={(e) => setBookingData({ ...bookingData, hora: e.target.value })} />
          <textarea placeholder="Notas" value={bookingData.notas} onChange={(e) => setBookingData({ ...bookingData, notas: e.target.value })} style={{ gridColumn: '1 / -1' }} />
          <button type="submit" style={{ gridColumn: '1 / -1', width: 120 }}>Crear</button>
        </form>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2>Filtros de reservas</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value, page: 1 })}>
            <option value="">Estado todos</option>
            <option value="pendiente">pendiente</option>
            <option value="confirmada">confirmada</option>
            <option value="cancelada">cancelada</option>
            <option value="completada">completada</option>
          </select>
          <button onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}>Anterior</button>
          <span>Página {filters.page}</span>
          <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Siguiente</button>
        </div>
      </section>

      <section>
        <h2>Listado de reservas</h2>
        {bookings.length === 0 ? (
          <p>No hay reservas</p>
        ) : (
          <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b._id}</td>
                  <td>{b.usuario?.nombre || b.usuario?.email}</td>
                  <td>{b.servicio?.nombre}</td>
                  <td>{new Date(b.fecha).toLocaleDateString()}</td>
                  <td>{b.hora}</td>
                  <td>{b.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {user?.rol === 'admin' && (
        <section>
          <h2>Acciones de admin</h2>
          <p>En este demo, el admin puede crear/doctores/servicios desde API + CRUD normal.</p>
        </section>
      )}
    </div>
  );
}