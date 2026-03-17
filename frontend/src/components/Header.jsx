import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaUserMd } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button className={styles.brand} onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
          <FaCalendarCheck />
          <span>Sistema de Reservas</span>
        </button>

        <nav className={styles.nav}>
          <Link to={isAuthenticated ? '/dashboard' : '/'}>Inicio</Link>
          <Link to={isAuthenticated ? '/turnos' : '/'}>Turnos</Link>
          <Link to={isAuthenticated ? '/perfil' : '/'}>
            <FaUserMd />
            <span>Mi Perfil</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
