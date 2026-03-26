import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaCalendarCheck, FaChevronDown, FaSitemap, FaUserMd } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import NotificacionCenter from './NotificacionCenter';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const closeAllMenus = () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button className={styles.brand} onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
          <FaCalendarCheck />
          <span>Sistema Clinico</span>
        </button>

        <button className={styles.mobileToggle} onClick={() => setIsMenuOpen((prev) => !prev)}>
          <FaBars />
          <span>Menu</span>
        </button>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          <Link to={isAuthenticated ? '/dashboard' : '/'} onClick={closeAllMenus}>Inicio</Link>

          {isAuthenticated && (
            <div className={styles.dropdown} ref={dropdownRef}>
              <button className={styles.dropdownTrigger} onClick={() => setIsDropdownOpen((prev) => !prev)}>
                <span>Gestion</span>
                <FaChevronDown className={isDropdownOpen ? styles.rotate : ''} />
              </button>
              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <Link to="/dashboard" onClick={closeAllMenus}>Panel principal</Link>
                  <Link to="/turnos" onClick={closeAllMenus}>Turnos</Link>
                  <Link to="/gestion/medicos" onClick={closeAllMenus}>Gestion de Medicos</Link>
                  <Link to="/gestion/pacientes" onClick={closeAllMenus}>Gestion de Pacientes</Link>
                  <Link to="/recetas" onClick={closeAllMenus}>Recetas</Link>
                  <Link to="/perfil" onClick={closeAllMenus}>Mi perfil</Link>
                  <Link to="/organigrama" onClick={closeAllMenus}>
                    <FaSitemap />
                    <span>Organigrama</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {isAuthenticated && <NotificacionCenter />}
          <Link to={isAuthenticated ? '/perfil' : '/'} onClick={closeAllMenus}>
            <FaUserMd />
            <span>Mi Perfil</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
