import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaCalendarCheck, FaChevronDown, FaUserMd } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import NotificacionCenter from './NotificacionCenter';
import {
  canAccessNursingArea,
  canAccessOrganigrama,
  canAccessPizarra,
  canAccessOrdenesMedicas,
  canAccessTeleconsultas,
  canAccessRecetas,
  canAccessSupport,
  canManageDoctors,
  canManagePatients,
} from '../utils/roles';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const {
    isAuthenticated,
    user,
    isGuestSession,
    demoMode,
    demoRole,
    setDemoMode,
    setDemoRole,
  } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const role = user?.rol;
  const isRealSession = isAuthenticated && !isGuestSession;
  const showPrivateMenu = isAuthenticated || isGuestSession;

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
        <button className={styles.brand} onClick={() => navigate('/dashboard')}>
          <FaCalendarCheck />
          <span>Sistema Clinico</span>
        </button>

        <button className={styles.mobileToggle} onClick={() => setIsMenuOpen((prev) => !prev)}>
          <FaBars />
          <span>Menu</span>
        </button>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          <button
            type="button"
            className={styles.demoToggle}
            onClick={() => setDemoMode(!demoMode)}
          >
            {demoMode ? 'Modo Demo: ON' : 'Modo Demo: OFF'}
          </button>

          {demoMode && (
            <select
              className={styles.demoSelect}
              value={demoRole || 'admin'}
              onChange={(e) => setDemoRole(e.target.value)}
              aria-label="Seleccionar vista de demo"
            >
              <option value="admin">Vista demo: Administrativo</option>
              <option value="paciente">Vista demo: Paciente</option>
            </select>
          )}

          <select
            className={styles.demoSelect}
            value={i18n.language}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              localStorage.setItem('appLanguage', e.target.value);
            }}
            aria-label="Seleccionar idioma"
          >
            <option value="es">🌐 ES</option>
            <option value="en">🌐 EN</option>
            <option value="pt">🌐 PT</option>
          </select>

          {showPrivateMenu && (
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
                  {canAccessNursingArea(role) && <Link to="/enfermeria" onClick={closeAllMenus}>Enfermeria</Link>}
                  {canAccessPizarra(role) && <Link to="/pizarra" onClick={closeAllMenus}>Pizarra Camas</Link>}
                  {canAccessOrdenesMedicas(role) && <Link to="/ordenes-medicas" onClick={closeAllMenus}>Ordenes Medicas</Link>}
                  {canAccessTeleconsultas(role) && <Link to="/teleconsultas" onClick={closeAllMenus}>Teleconsultas</Link>}
                  <Link to="/perfil" onClick={closeAllMenus}>Mi perfil</Link>
                  {canAccessOrganigrama(role) && <Link to="/organigrama" onClick={closeAllMenus}>Organigrama</Link>}
                </div>
              )}
            </div>
          )}

          {isRealSession && <NotificacionCenter />}
          {isRealSession ? (
            <Link to="/perfil" onClick={closeAllMenus}>
              <FaUserMd />
              <span>Mi Perfil</span>
            </Link>
          ) : (
            <Link to="/login" onClick={closeAllMenus}>
              <FaUserMd />
              <span>Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
