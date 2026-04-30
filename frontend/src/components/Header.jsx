import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaCalendarCheck, FaChevronDown, FaUserMd } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { i18n, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
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
          <span>{t('common.menu', 'Menu')}</span>
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
            <>
              <select
                className={styles.demoSelect}
                value={demoRole || 'admin'}
                onChange={(e) => setDemoRole(e.target.value)}
                aria-label="Seleccionar vista de demo"
              >
                <option value="admin">Vista demo: Administrativo</option>
                <option value="paciente">Vista demo: Paciente</option>
              </select>
              <button
                type="button"
                className={styles.demoToggle}
                title="Reiniciar tour guiado"
                onClick={() => {
                  localStorage.removeItem('demoTourDone:admin');
                  localStorage.removeItem('demoTourDone:paciente');
                  sessionStorage.removeItem('demoTourState');
                  navigate('/dashboard');
                }}
              >
                🔄 Reiniciar tour
              </button>
            </>
          )}

          <button
            type="button"
            className={styles.demoToggle}
            onClick={toggleTheme}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? 'Tema: Oscuro' : 'Tema: Claro'}
          </button>

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
                <span data-tour="gestion">{t('nav.management', 'Gestion')}</span>
                <FaChevronDown className={isDropdownOpen ? styles.rotate : ''} />
              </button>
              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <Link to="/dashboard" data-tour="dashboard" onClick={closeAllMenus}>{t('nav.dashboard', 'Panel principal')}</Link>
                  <Link to="/turnos" onClick={closeAllMenus}>{t('nav.appointments', 'Turnos')}</Link>
                  {canManageDoctors(role) && <Link to="/gestion/medicos" onClick={closeAllMenus}>{t('nav.doctors', 'Medicos')}</Link>}
                  {canManagePatients(role) && <Link to="/gestion/pacientes" onClick={closeAllMenus}>{t('nav.patients', 'Pacientes')}</Link>}
                  {canAccessRecetas(role) && <Link to="/recetas" onClick={closeAllMenus}>{t('nav.prescriptions', 'Recetas')}</Link>}
                  {canAccessSupport(role) && <Link to="/soporte" data-tour="soporte" onClick={closeAllMenus}>{t('nav.support', 'Soporte')}</Link>}
                  {canAccessNursingArea(role) && <Link to="/enfermeria" onClick={closeAllMenus}>{t('nav.nursing', 'Enfermeria')}</Link>}
                  {canAccessPizarra(role) && <Link to="/pizarra" data-tour="pizarra" onClick={closeAllMenus}>{t('nav.bedBoard', 'Pizarra Camas')}</Link>}
                  {canAccessOrdenesMedicas(role) && <Link to="/ordenes-medicas" data-tour="ordenes" onClick={closeAllMenus}>{t('nav.medicalOrders', 'Ordenes Medicas')}</Link>}
                  {canAccessTeleconsultas(role) && <Link to="/teleconsultas" onClick={closeAllMenus}>{t('nav.teleconsultations', 'Teleconsultas')}</Link>}
                  <Link to="/perfil" onClick={closeAllMenus}>{t('nav.profile', 'Mi perfil')}</Link>
                  {canAccessOrganigrama(role) && <Link to="/organigrama" onClick={closeAllMenus}>{t('nav.organigram', 'Organigrama')}</Link>}
                </div>
              )}
            </div>
          )}

          {isRealSession && <NotificacionCenter />}
          {isRealSession ? (
            <Link to="/perfil" onClick={closeAllMenus}>
              <FaUserMd />
              <span>{t('nav.profile', 'Mi Perfil')}</span>
            </Link>
          ) : (
            <Link to="/login" onClick={closeAllMenus}>
              <FaUserMd />
              <span>{t('auth.login', 'Login')}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
