import React, { useEffect, useState } from 'react';
import { getDoctors } from './services/appointmentService';
import { getServices } from './services/serviceService';
import { register, login } from './services/authService';
import { getBookings, createBooking } from './services/bookingService';

function App() {
  const [view, setView] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [errors, setErrors] = useState([]);

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [authData, setAuthData] = useState({ name: '', email: '', phone: '', password: '' });
  const [bookingData, setBookingData] = useState({ doctor: '', service: '', date: '', time: '', notes: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const docs = await getDoctors();
        setDoctors(docs);
        const srv = await getServices();
        setServices(srv);

        if (token) {
          const b = await getBookings({ headers: { Authorization: `Bearer ${token}` } });
          setBookings(b.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [token]);

  const validateLoginPayload = () => {
    const errors = [];
    if (!authData.email) errors.push('Email es obligatorio');
    if (!authData.password) errors.push('Password es obligatorio');
    return errors;
  };

  const validateRegisterPayload = () => {
    const errors = [];
    if (!authData.name) errors.push('Nombre es obligatorio');
    if (!authData.email) errors.push('Email es obligatorio');
    if (!authData.phone) errors.push('Teléfono es obligatorio');
    if (authData.password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres');
    return errors;
  };

  const validateBookingData = () => {
    const v = [];
    if (!bookingData.doctor) v.push('Debe seleccionar doctor');
    if (!bookingData.service) v.push('Debe seleccionar servicio');
    if (!bookingData.date) v.push('Debe seleccionar fecha');
    if (!bookingData.time) v.push('Debe seleccionar hora');
    return v;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validation = validateRegisterPayload();
    if (validation.length > 0) return setErrors(validation);

    try {
      const res = await register({
        name: authData.name,
        email: authData.email,
        phone: authData.phone,
        password: authData.password,
      });
      setToken(res.data.token);
      setUser(res.data.patient || res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.patient || res.data.user));
      setView('dashboard');
      setErrors([]);
    } catch (err) {
      setErrors([err.response?.data?.message || 'Error en registro']);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const validation = validateLoginPayload();
    if (validation.length > 0) return setErrors(validation);

    try {
      const res = await login({ email: authData.email, password: authData.password });
      setToken(res.data.token);
      setUser(res.data.patient || res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.patient || res.data.user));
      setView('dashboard');
      setErrors([]);
    } catch (err) {
      setErrors([err.response?.data?.message || 'Error en login']);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    const validation = validateBookingData();
    if (validation.length > 0) return setErrors(validation);

    if (!token) {
      setErrors(['No estás autenticado']);
      return;
    }

    try {
      await createBooking(
        {
          usuario: user?._id,
          servicio: bookingData.service,
          fecha: bookingData.date,
          hora: bookingData.time,
          fechaHoraReserva: new Date(),
          notas: bookingData.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const b = await getBookings({ headers: { Authorization: `Bearer ${token}` } });
      setBookings(b.data);
      setBookingData({ doctor: '', service: '', date: '', time: '', notes: '' });
      setErrors([]);
    } catch (err) {
      setErrors([err.response?.data?.message || 'Error creando booking']);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  };

  if (view !== 'dashboard') {
    return (
      <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 450, margin: 'auto' }}>
        <h1>{view === 'login' ? 'Login' : 'Registro'}</h1>

        <button
          onClick={() => {
            setView('login');
            setErrors([]);
          }}
          style={{ marginRight: 8 }}
        >
          Login
        </button>
        <button
          onClick={() => {
            setView('register');
            setErrors([]);
          }}
        >
          Register
        </button>

        <form onSubmit={view === 'login' ? handleLogin : handleRegister} style={{ marginTop: 20 }}>
          {view === 'register' && (
            <div>
              <label>Nombre</label>
              <input
                type="text"
                value={authData.name}
                onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
              />
            </div>
          )}
          <div>
            <label>Email</label>
            <input
              type="email"
              value={authData.email}
              onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
            />
          </div>
          {view === 'register' && (
            <div>
              <label>Teléfono</label>
              <input
                type="text"
                value={authData.phone}
                onChange={(e) => setAuthData({ ...authData, phone: e.target.value })}
              />
            </div>
          )}
          <div>
            <label>Password</label>
            <input
              type="password"
              value={authData.password}
              onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
            />
          </div>
          <button type="submit" style={{ marginTop: 12 }}>
            {view === 'login' ? 'Ingresar' : 'Registrarse'}
          </button>
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
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 900, margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard - Reserva de Turnos</h1>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <h2>Crear Booking</h2>
      <form onSubmit={handleBooking} style={{ marginBottom: 16 }}>
        <div>
          <label>Doctor</label>
          <select
            value={bookingData.doctor}
            onChange={(e) => setBookingData({ ...bookingData, doctor: e.target.value })}
          >
            <option value="">Seleccione doctor</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.specialty})
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

