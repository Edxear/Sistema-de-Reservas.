import { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, register as apiRegister, getMe as apiGetMe, updateMe as apiUpdateMe, logout as apiLogout } from '../services/authService';
import { toast } from 'react-toastify';

export const AuthContext = createContext(null);

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  // Restaura sesión desde cookie httpOnly (el token no es accesible desde JS)
  useEffect(() => {
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
  }, []);

  // Función para iniciar sesión
  const login = async (credentials) => {
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
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}