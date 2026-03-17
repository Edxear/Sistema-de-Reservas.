import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 
import styles from './LoginRegister.module.css';

export default function LoginRegister() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const [loading, setLoading] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const emailNormalizado = form.email.trim().toLowerCase();

    let result;
    if (mode === 'register') {
      result = await register({ ...form, email: emailNormalizado });
    } else {
      result = await login({ email: emailNormalizado, password: form.password });
    }

    if (result.success) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>{mode === 'login' ? 'Iniciar Sesion' : 'Registro'}</h2>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => setMode('login')}
            disabled={mode === 'login'}
            type="button"
          >
            Login
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => setMode('register')}
            disabled={mode === 'register'}
            type="button"
          >
            Registro
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
        {mode === 'register' && (
          <div className={styles.field}>
            <label className={styles.label}>Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={styles.input}
              required
            />
          </div>
        )}
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={styles.input}
            required
          />
        </div>
        {mode === 'register' && (
          <div className={styles.field}>
            <label className={styles.label}>Teléfono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className={styles.input}
              required
            />
          </div>
        )}
        <div className={styles.field}>
          <label className={styles.label}>Contraseña</label>
          <div className={styles.passwordWrap}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Registrarse'}
        </button>
        </form>
      </div>
    </div>
  );
}