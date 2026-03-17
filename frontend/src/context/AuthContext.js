import { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, register as apiRegister, getMe as apiGetMe, updateMe as apiUpdateMe } from '../services/authService';
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

  // Efecto para cargar la sesión del localStorage al iniciar la app
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      apiGetMe({ headers: { Authorization: `Bearer ${storedToken}` } })
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        });
    }
    setLoading(false); // Marcamos que ya terminamos de cargar
  }, []);

  // Función para iniciar sesión
  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      const { token, user } = response.data;

      // Guardar en el estado
      setToken(token);
      setUser(user);

      // Guardar en localStorage para persistencia
      localStorage.setItem('token', token);
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
      const { token, user } = response.data;

      setToken(token);
      setUser(user);

      localStorage.setItem('token', token);
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
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('Sesión cerrada');
  };

  const refreshProfile = async () => {
    if (!token) return { success: false, error: 'No autenticado' };
    try {
      const res = await apiGetMe({ headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error obteniendo perfil' };
    }
  };

  const updateProfile = async (data) => {
    if (!token) return { success: false, error: 'No autenticado' };
    try {
      const res = await apiUpdateMe(data, { headers: { Authorization: `Bearer ${token}` } });
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
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}