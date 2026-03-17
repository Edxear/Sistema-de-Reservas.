import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

export default function LoginRegister() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();
  const { login, register } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (mode === 'register') {
      result = await register(form);
    } else {
      result = await login({ email: form.email, password: form.password });
    }

    if (result.success) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: '30px auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>{mode === 'login' ? 'Iniciar Sesión' : 'Registro'}</h2>
      <p>
        <button onClick={() => setMode('login')} disabled={mode === 'login'}>
          Login
        </button>
        <button onClick={() => setMode('register')} disabled={mode === 'register'}>
          Registro
        </button>
      </p>
      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div>
            <label>Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </div>
        )}
        <div>
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        {mode === 'register' && (
          <div>
            <label>Teléfono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              required
            />
          </div>
        )}
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}