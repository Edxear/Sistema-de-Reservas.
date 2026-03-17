import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LoginRegister />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function DashboardComponent() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState([]);
  const [bookingData, setBookingData] = useState({
    service: '',
    employee: '',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    fetchBookings();
    fetchServices();
    fetchEmployees();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      toast.error('Error al cargar reservas');
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/services', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setServices(data);
    } catch (error) {
      toast.error('Error al cargar servicios');
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      toast.error('Error al cargar empleados');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    // Validaciones básicas
    const newErrors = [];
    if (!bookingData.service) newErrors.push('Debe seleccionar un servicio');
    if (!bookingData.employee) newErrors.push('Debe seleccionar un empleado');
    if (!bookingData.date) newErrors.push('Debe seleccionar una fecha');
    if (!bookingData.time) newErrors.push('Debe seleccionar una hora');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        toast.success('Reserva creada exitosamente');
        setBookingData({
          service: '',
          employee: '',
          date: '',
          time: '',
          notes: ''
        });
        fetchBookings(); // Recargar la lista
      } else {
        const errorData = await response.json();
        setErrors([errorData.message || 'Error al crear la reserva']);
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Crear nueva reserva</h2>
      <form onSubmit={handleBookingSubmit}>
        <div>
          <label>Empleado</label>
          <select
            value={bookingData.employee}
            onChange={(e) => setBookingData({ ...bookingData, employee: e.target.value })}
          >
            <option value="">Seleccione empleado</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.nombre} {emp.apellido}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Servicio</label>
          <select
            value={bookingData.service}
            onChange={(e) => setBookingData({ ...bookingData, service: e.target.value })}
          >
            <option value="">Seleccione servicio</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.nombre} - {s.duracion} min
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Fecha</label>
          <input
            type="date"
            value={bookingData.date}
            onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
          />
        </div>
        <div>
          <label>Hora</label>
          <input
            type="time"
            value={bookingData.time}
            onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
          />
        </div>
        <div>
          <label>Notas</label>
          <textarea
            value={bookingData.notes}
            onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
          />
        </div>
        <button type="submit">Crear Booking</button>
      </form>

      {errors.length > 0 && (
        <div style={{ marginTop: 16, color: 'red' }}>
          <ul>
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <h2>Mis reservas</h2>
      <table border="1" cellPadding="8" style={{ width: '100%' }}>
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
          {bookings.length === 0 ? (
            <tr>
              <td colSpan="6">No hay reservas</td>
            </tr>
          ) : (
            bookings.map((b) => (
              <tr key={b._id}>
                <td>{b._id}</td>
                <td>{b.usuario?.name || b.usuario?.nombre || 'n/a'}</td>
                <td>{b.servicio?.nombre || 'n/a'}</td>
                <td>{new Date(b.fecha).toLocaleDateString()}</td>
                <td>{b.hora}</td>
                <td>{b.estado}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;