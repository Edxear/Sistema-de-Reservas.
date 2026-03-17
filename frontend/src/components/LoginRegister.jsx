import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register, login } from '../services/authService';

export default function LoginRegister() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'register') {
        const res = await register(form);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        const res = await login({ email: form.email, password: form.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      toast.success('Bienvenido');
      navigate('/dashboard');
    } catch (err) {
      let error = 'Error de autenticación';
      if (err.response?.data?.errors) error = err.response.data.errors.map((x) => x.msg).join(', ');
      else if (err.response?.data?.message) error = err.response.data.message;
      toast.error(error);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '30px auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>{mode === 'login' ? 'Login' : 'Registro'}</h2>
      <p>
        <button onClick={() => setMode('login')} disabled={mode === 'login'}>Login</button>
        <button onClick={() => setMode('register')} disabled={mode === 'register'}>Registro</button>
      </p>
      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div>
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
        )}
        <div>
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        {mode === 'register' && (
          <div>
            <label>Teléfono</label>
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required />
          </div>
        )}
        <div>
          <label>Contraseña</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button type="submit">{mode === 'login' ? 'Ingresar' : 'Registrarse'}</button>
      </form>
    </div>
  );
}
