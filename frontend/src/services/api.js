import axios from 'axios';

const API_HOST = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_BASE_URL = `${API_HOST}/api`;

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default API;