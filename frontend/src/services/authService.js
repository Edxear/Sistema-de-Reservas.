import API from './api';

export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = (config = {}) => API.get('/auth/me', config);
export const updateMe = (data, config = {}) => API.put('/auth/me', data, config);
