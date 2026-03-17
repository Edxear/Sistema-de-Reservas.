import { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/authService';
import { toast } from 'react-toastify';

// Crear el contexto
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
  const [loading, setLoading] = useState(true); // Para saber si ya cargamos la info del localStorage

  // Efecto para cargar la sesión del localStorage al iniciar la app
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
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

  // Valor que se proveerá a los componentes hijos
  const value = {
    token,
    user,
    loading, // Útil para mostrar un spinner mientras se carga la sesión
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}