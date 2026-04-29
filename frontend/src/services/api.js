import axios from 'axios';
import { toast } from 'react-toastify';
import { isDemoModeEnabled, mockApiRequest } from './demoApi';

const API_HOST = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_BASE_URL = `${API_HOST}/api`;

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const defaultAdapter = typeof axios.getAdapter === 'function'
  ? axios.getAdapter(axios.defaults.adapter)
  : API.defaults.adapter;

API.interceptors.request.use((config) => {
  if (isDemoModeEnabled()) {
    config.adapter = mockApiRequest;
  } else if (defaultAdapter) {
    config.adapter = defaultAdapter;
  }

  return config;
});

API.interceptors.response.use(
  (response) => {
    if (response?.data?._demoBlocked) {
      toast.warn(response.data.message || 'Accion no disponible en modo demo.');
    }

    return response;
  },
  (error) => Promise.reject(error),
);

export default API;