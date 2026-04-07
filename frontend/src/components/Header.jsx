import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaCalendarCheck, FaChevronDown, FaSitemap, FaUserMd } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import NotificacionCenter from './NotificacionCenter';
import {
  canAccessNursingArea,
  canAccessOrganigrama,
  canAccessPizarra,
  canAccessRecetas,
  canAccessSupport,
  canManageDoctors,
  canManagePatients,
} from '../utils/roles';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const role = user?.rol;

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
                  {canManageDoctors(role) && <Link to="/gestion/medicos" onClick={closeAllMenus}>Medicos</Link>}
                  {canManagePatients(role) && <Link to="/gestion/pacientes" onClick={closeAllMenus}>Pacientes</Link>}
                  {canAccessRecetas(role) && <Link to="/recetas" onClick={closeAllMenus}>Recetas</Link>}
                  {canAccessSupport(role) && <Link to="/soporte" onClick={closeAllMenus}>Soporte</Link>}
                  {canAccessSupport(role) && <Link to="/gestion/obra-social" onClick={closeAllMenus}>Solicitudes Obra Social</Link>}
                  {canAccessNursingArea(role) && <Link to="/enfermeria" onClick={closeAllMenus}>Enfermeria</Link>}
                  {canAccessPizarra(role) && <Link to="/pizarra" onClick={closeAllMenus}>🏥 Pizarra Camas</Link>}
                  <Link to="/perfil" onClick={closeAllMenus}>Mi perfil</Link>
                  {canAccessOrganigrama(role) && (
                    <Link to="/organigrama" onClick={closeAllMenus}>
                      <FaSitemap />
                      <span>Organigrama</span>
                    </Link>
                  )}
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
