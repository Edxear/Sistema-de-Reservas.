import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaCalendarCheck, FaChevronDown, FaUserMd } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificacionCenter from './NotificacionCenter';
import {
  canAccessNursingArea,
  canAccessMentalHealthArea,
  canAccessGuardiaMedicaArea,
  canAccessMantenimientoArea,
  canAccessParamedicosArea,
  canAccessOrganigrama,
  canAccessPizarra,
  canAccessOrdenesMedicas,
  canAccessTeleconsultas,
  canAccessRecetas,
  canAccessSupport,
  canManageDoctors,
  canManagePatients,
  hasAnyAllowedRole,
  isAdminRole,
} from '../utils/roles';
import { STRATEGIC_MODULES } from '../data/strategicModules';
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
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const demoDropdownRef = useRef(null);
  const role = user?.rol;
  const visibleStrategicModules = STRATEGIC_MODULES.filter((module) => hasAnyAllowedRole(user, module.allowedRoles));
  const groupedStrategicModules = visibleStrategicModules.reduce((acc, module) => {
    const category = module.category || 'General';
    acc[category] = acc[category] || [];
    acc[category].push(module);
    return acc;
  }, {});
  const isPublicDemoHost = typeof window !== 'undefined' && (
    window.location.hostname.toLowerCase() === 'sistema-de-reservas-eta.vercel.app'
    || window.location.hostname.toLowerCase().endsWith('.sistema-de-reservas-eta.vercel.app')
  );
  const isRealSession = isAuthenticated && !isGuestSession;
  const showPrivateMenu = isAuthenticated || isGuestSession;

  useEffect(() => {
    const onDocClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (!demoDropdownRef.current?.contains(event.target)) {
        setIsDemoMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const closeAllMenus = () => {
    setIsDropdownOpen(false);
    setIsDemoMenuOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button className={styles.brand} onClick={() => navigate('/dashboard')}>
          <FaCalendarCheck />
          <span>IntegraSalud</span>
        </button>

        <button className={styles.mobileToggle} onClick={() => setIsMenuOpen((prev) => !prev)}>
          <FaBars />
          <span>{t('common.menu', 'Menu')}</span>
        </button>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          {isPublicDemoHost && (
          <div className={styles.dropdown} ref={demoDropdownRef}>
            <button
              type="button"
              className={styles.dropdownTrigger}
              onClick={() => setIsDemoMenuOpen((prev) => !prev)}
              aria-label="Controles de demo"
            >
              <span>Demo {demoMode ? 'ON' : 'OFF'}</span>
              <FaChevronDown className={isDemoMenuOpen ? styles.rotate : ''} />
            </button>
            {isDemoMenuOpen && (
              <div className={`${styles.dropdownMenu} ${styles.demoDropdownMenu}`}>
                <button
                  type="button"
                  className={styles.demoMenuButton}
                  onClick={() => setDemoMode(!demoMode)}
                >
                  {demoMode ? 'Modo Demo: ON' : 'Modo Demo: OFF'}
                </button>

                <select
                  className={styles.demoSelect}
                  value={demoRole || 'admin'}
                  onChange={(e) => setDemoRole(e.target.value)}
                  aria-label="Seleccionar vista de demo"
                  disabled={!demoMode}
                >
                  <option value="admin">Vista demo: Administrativo</option>
                  <option value="paciente">Vista demo: Paciente</option>
                </select>

                <button
                  type="button"
                  className={styles.demoMenuButton}
                  title="Reiniciar tour guiado"
                  disabled={!demoMode}
                  onClick={() => {
                    localStorage.removeItem('demoTourDone:admin');
                    localStorage.removeItem('demoTourDone:paciente');
                    sessionStorage.removeItem('demoTourState');
                    sessionStorage.removeItem('demoTourState:admin');
                    sessionStorage.removeItem('demoTourState:paciente');
                    sessionStorage.setItem('demoTourResetNonce', String(Date.now()));
                    window.dispatchEvent(new Event('demo-tour-reset'));
                    navigate('/dashboard');
                    setIsDemoMenuOpen(false);
                  }}
                >
                  Reiniciar tour
                </button>
              </div>
            )}
          </div>
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
            <div className={`${styles.dropdown} ${styles.managementDropdown}`} ref={dropdownRef}>
              <button className={styles.dropdownTrigger} onClick={() => setIsDropdownOpen((prev) => !prev)}>
                <span data-tour="gestion">{t('nav.management', 'Gestion')}</span>
                <FaChevronDown className={isDropdownOpen ? styles.rotate : ''} />
              </button>
              {isDropdownOpen && (
                <div className={`${styles.dropdownMenu} ${styles.dropdownMenu3col}`}>
                  {/* Columna izquierda — Clínico */}
                  <div className={styles.menuCol}>
                    <span className={styles.colHeader}>Clínico</span>
                    <Link to="/dashboard" data-tour="dashboard" onClick={closeAllMenus}>{t('nav.dashboard', 'Panel principal')}</Link>
                    <Link to="/turnos" onClick={closeAllMenus}>{t('nav.appointments', 'Turnos')}</Link>
                    {canAccessPizarra(role) && <Link to="/pizarra" data-tour="pizarra" onClick={closeAllMenus}>{t('nav.bedBoard', 'Pizarra Camas')}</Link>}
                    {canAccessOrdenesMedicas(role) && <Link to="/ordenes-medicas" data-tour="ordenes" onClick={closeAllMenus}>{t('nav.medicalOrders', 'Órdenes Médicas')}</Link>}
                    {canAccessRecetas(role) && <Link to="/recetas" onClick={closeAllMenus}>{t('nav.prescriptions', 'Recetas')}</Link>}
                    {canAccessTeleconsultas(role) && <Link to="/teleconsultas" onClick={closeAllMenus}>{t('nav.teleconsultations', 'Teleconsultas')}</Link>}
                  </div>
                  {/* Columna del medio — Áreas y Gestión */}
                  <div className={styles.menuCol}>
                    <span className={styles.colHeader}>Áreas y Gestión</span>
                    {canManageDoctors(role) && <Link to="/gestion/medicos" onClick={closeAllMenus}>{t('nav.doctors', 'Médicos')}</Link>}
                    {canManagePatients(role) && <Link to="/gestion/pacientes" onClick={closeAllMenus}>{t('nav.patients', 'Pacientes')}</Link>}
                    {canAccessNursingArea(role) && <Link to="/enfermeria" onClick={closeAllMenus}>{t('nav.nursing', 'Enfermería')}</Link>}
                    {canAccessMentalHealthArea(user) && <Link to="/salud-mental" onClick={closeAllMenus}>{t('nav.mentalHealth', 'Salud Mental')}</Link>}
                    {canAccessGuardiaMedicaArea(user) && <Link to="/guardia-medica" onClick={closeAllMenus}>{t('nav.er', 'Guardia Médica')}</Link>}
                    {canAccessParamedicosArea(user) && <Link to="/paramedicos-ambulancia" onClick={closeAllMenus}>{t('nav.paramedics', 'Paramédicos')}</Link>}
                    {canAccessMantenimientoArea(user) && <Link to="/mantenimiento" onClick={closeAllMenus}>{t('nav.maintenance', 'Mantenimiento')}</Link>}
                    {isAdminRole(role) && <Link to="/dashboard-operacional" onClick={closeAllMenus}>{t('nav.operationalDashboard', 'Dashboard Operacional')}</Link>}
                    {canAccessSupport(role) && <Link to="/soporte" data-tour="soporte" onClick={closeAllMenus}>{t('nav.support', 'Soporte')}</Link>}
                    {canAccessOrganigrama(role) && <Link to="/organigrama" onClick={closeAllMenus}>{t('nav.organigram', 'Organigrama')}</Link>}
                    <Link to="/perfil" onClick={closeAllMenus}>{t('nav.profile', 'Mi perfil')}</Link>
                  </div>

                  {/* Columna derecha — Módulos Estratégicos */}
                  <div className={styles.menuCol}>
                    <span className={styles.colHeader}>Módulos Estratégicos</span>
                    {visibleStrategicModules.length > 0 && <Link to="/modulos-estrategicos" onClick={closeAllMenus}>Ver hub de módulos</Link>}
                    {visibleStrategicModules.length > 0 && Object.entries(groupedStrategicModules).map(([category, modules]) => (
                      <div key={category} className={styles.groupedLinksBlock}>
                        <span className={styles.subColHeader}>{category}</span>
                        {modules.map((module) => (
                          <Link key={module.key} to={module.path} className={styles.subMenuLink} onClick={closeAllMenus}>
                            {module.title}
                          </Link>
                        ))}
                      </div>
                    ))}
                    {visibleStrategicModules.length === 0 && (
                      <span className={styles.emptyHint}>Sin módulos asignados para este rol.</span>
                    )}
                  </div>
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
