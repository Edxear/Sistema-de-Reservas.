import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext'; 
import styles from './LoginRegister.module.css';

export default function LoginRegister() {
  const { t } = useTranslation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const [loading, setLoading] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth(); 
  const isPublicDemoHost = typeof window !== 'undefined' && (
    window.location.hostname.toLowerCase() === 'sistema-de-reservas-eta.vercel.app'
    || window.location.hostname.toLowerCase().endsWith('.sistema-de-reservas-eta.vercel.app')
  );

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
        <h2 className={styles.title}>{mode === 'login' ? t('auth.loginTitle', 'Iniciar Sesion') : t('auth.register', 'Registro')}</h2>
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
          {loading ? t('common.loading', 'Cargando...') : mode === 'login' ? t('nav.login', 'Ingresar') : t('auth.register', 'Registrarse')}
        </button>
        </form>
      </div>

      {/* Demo CTA */}
      {isPublicDemoHost && (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '10px' }}>
          {t('auth.exploreWithoutAccount', '¿Querés explorar el sistema sin cuenta?')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/demo')}
          style={{
            background: 'linear-gradient(135deg, #1e5a7a, #2980b9)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 28px',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(41, 128, 185, 0.4)',
          }}
        >
          {t('auth.tryDemo', '🧪 Probar en modo demo')}
        </button>
      </div>
      )}
    </div>
  );
}
