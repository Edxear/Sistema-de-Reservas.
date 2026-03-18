import axios from 'axios';

const API_HOST = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_BASE_URL = `${API_HOST}/api`;

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar el token a cada petición
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;