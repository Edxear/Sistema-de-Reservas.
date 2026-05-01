import { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, register as apiRegister, getMe as apiGetMe, updateMe as apiUpdateMe, logout as apiLogout } from '../services/authService';
import { toast } from 'react-toastify';
import { ROLE } from '../utils/roles';

export const AuthContext = createContext(null);

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

const DEMO_MODE = process.env.REACT_APP_DEMO_MODE !== 'false';
const PUBLIC_DEMO_HOSTS = ['sistema-de-reservas-eta.vercel.app'];
const REAL_MODE_UNLOCK_KEY = 'demoRealModeUnlocked';

const isPublicDemoHost = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  return PUBLIC_DEMO_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
};

const readDemoModeFromQuery = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const mode = (params.get('modo') || '').toLowerCase();
  if (mode === 'demo') return true;
  if (mode === 'real') return false;
  return null;
};

const canUseRealMode = () => {
  if (typeof window === 'undefined') return !isPublicDemoHost();
  if (!isPublicDemoHost()) return true;
  return window.localStorage.getItem(REAL_MODE_UNLOCK_KEY) === 'true';
};
const DEMO_PROFILES = {
  admin: {
    id: 'demo-user',
    nombre: 'Administrativo Demo',
    email: 'admin.demo@demo.local',
    rol: ROLE.ADMIN,
    esSuperAdminPrincipal: false,
  },
  paciente: {
    id: 'pat-1',
    nombre: 'Paciente Demo',
    email: 'carlos.benitez@demo.local',
    rol: ROLE.PACIENTE,
    esSuperAdminPrincipal: false,
    obraSocial: 'Obra Social',
    numeroAfiliado: 'SM-245677',
  },
};

const getDemoUser = (demoRole) => DEMO_PROFILES[demoRole] || DEMO_PROFILES.paciente;

const readDemoModePreference = () => {
  if (typeof window === 'undefined') return DEMO_MODE;

  const queryMode = readDemoModeFromQuery();
  if (queryMode === false) {
    window.localStorage.setItem(REAL_MODE_UNLOCK_KEY, 'true');
    window.localStorage.setItem('demoModeOverride', 'false');
    return false;
  }
  if (queryMode === true) {
    window.localStorage.setItem('demoModeOverride', 'true');
    return true;
  }

  // In the public domain, default to demo unless real mode is explicitly requested via URL.
  if (isPublicDemoHost()) {
    window.localStorage.setItem('demoModeOverride', 'true');
    return true;
  }

  const storedValue = window.localStorage.getItem('demoModeOverride');
  if (storedValue === 'true') return true;
  if (storedValue === 'false') {
    if (!canUseRealMode()) {
      window.localStorage.setItem('demoModeOverride', 'true');
      return true;
    }
    return false;
  }
  return DEMO_MODE;
};

const readDemoRolePreference = () => {
  if (typeof window === 'undefined') return 'paciente';
  const storedValue = window.localStorage.getItem('demoRoleOverride');
  if (storedValue === 'admin') return 'admin';
  if (storedValue === 'paciente') return 'paciente';
  return 'paciente';
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(readDemoModePreference);
  const [demoRole, setDemoRole] = useState(readDemoRolePreference);

  // Restaura sesión desde cookie httpOnly (el token no es accesible desde JS)
  useEffect(() => {
    if (demoMode) {
      const demoUser = getDemoUser(demoRole);
      setUser(demoUser);
      setToken('demo-session');
      localStorage.setItem('user', JSON.stringify(demoUser));
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }

    apiGetMe()
      .then((res) => {
        setUser(res.data.user);
        setToken('cookie-session');
        localStorage.setItem('user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('user');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [demoMode, demoRole]);

  // Función para iniciar sesión
  const login = async (credentials) => {
    if (demoMode) {
      const demoUser = getDemoUser(demoRole);
      setToken('demo-session');
      setUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoUser));
      toast.success('Modo demo activo: acceso completo habilitado.');
      return { success: true };
    }

    try {
      const response = await apiLogin(credentials);
      const { user } = response.data;

      setToken('cookie-session');
      setUser(user);

      localStorage.setItem('user', JSON.stringify(user));

      toast.success('¡Inicio de sesión exitoso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Función para registrarse
  const register = async (userData) => {
    if (demoMode) {
      const demoUser = getDemoUser(demoRole);
      setToken('demo-session');
      setUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoUser));
      toast.success('Modo demo activo: registro simulado con éxito.');
      return { success: true };
    }

    try {
      const response = await apiRegister(userData);
      const { user } = response.data;

      setToken('cookie-session');
      setUser(user);

      localStorage.setItem('user', JSON.stringify(user));

      toast.success('¡Registro exitoso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrarse';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    if (demoMode) {
      toast.info('En modo demo no se requiere sesión.');
      return;
    }

    try {
      await apiLogout();
    } catch {
      // Si falla la API, igual limpiamos estado local para cerrar sesión en cliente.
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
    toast.info('Sesión cerrada');
  };

  const refreshProfile = async () => {
    if (demoMode) {
      return { success: true, user: getDemoUser(demoRole) };
    }

    if (!user) return { success: false, error: 'No autenticado' };
    try {
      const res = await apiGetMe();
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error obteniendo perfil' };
    }
  };

  const updateProfile = async (data) => {
    if (demoMode) {
      const mergedUser = { ...getDemoUser(demoRole), ...data };
      setUser(mergedUser);
      localStorage.setItem('user', JSON.stringify(mergedUser));
      return { success: true, user: mergedUser };
    }

    if (!user) return { success: false, error: 'No autenticado' };
    try {
      const res = await apiUpdateMe(data);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error actualizando perfil' };
    }
  };

  const setDemoModeEnabled = (enabled) => {
    const nextValue = Boolean(enabled);

    if (!nextValue && !canUseRealMode()) {
      toast.info('En este dominio el acceso publico queda en demo. Para modo real usa ?modo=real desde tu equipo.');
      localStorage.setItem('demoModeOverride', 'true');
      setDemoMode(true);
      return;
    }

    setLoading(true);
    setDemoMode(nextValue);
    localStorage.setItem('demoModeOverride', String(nextValue));

    if (!nextValue) {
      setToken(null);
      setUser(null);
      localStorage.removeItem('user');
    } else {
      // Reinicia el tour al pasar de OFF -> ON para ambos perfiles demo.
      localStorage.removeItem('demoTourDone:admin');
      localStorage.removeItem('demoTourDone:paciente');
      sessionStorage.removeItem('demoTourState');
      sessionStorage.removeItem('demoTourState:admin');
      sessionStorage.removeItem('demoTourState:paciente');
      sessionStorage.setItem('demoTourResetNonce', String(Date.now()));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('demo-tour-reset'));
      }

      const demoUser = getDemoUser(demoRole);
      setToken('demo-session');
      setUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoUser));
    }

    toast.info(nextValue ? 'Modo demo activado.' : 'Modo demo desactivado.');
  };

  const setDemoRoleEnabled = (role) => {
    const nextRole = role === 'paciente' ? 'paciente' : 'admin';
    setDemoRole(nextRole);
    localStorage.setItem('demoRoleOverride', nextRole);
    if (demoMode) {
      // Al cambiar de perfil demo, vuelve a iniciar el tour para ese perfil.
      localStorage.removeItem(`demoTourDone:${nextRole}`);
      sessionStorage.removeItem(`demoTourState:${nextRole}`);
      sessionStorage.setItem('demoTourResetNonce', String(Date.now()));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('demo-tour-reset'));
      }

      const demoUser = getDemoUser(nextRole);
      setUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoUser));
      toast.info(`Vista demo actual: ${nextRole === 'paciente' ? 'Paciente' : 'Administrativo'}.`);
    }
  };

  // Valor que se proveerá a los componentes hijos
  const value = {
    token,
    user,
    loading, // Útil para mostrar un spinner mientras se carga la sesión
    login,
    register,
    logout,
    refreshProfile,
    updateProfile,
    demoMode,
    demoRole,
    isGuestSession: demoMode,
    setDemoMode: setDemoModeEnabled,
    setDemoRole: setDemoRoleEnabled,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}