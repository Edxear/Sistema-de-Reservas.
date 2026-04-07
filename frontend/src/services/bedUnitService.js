import API from './api';

export const getBeds = async (params = {}) => {
  const res = await API.get('/censo-camas', { params });
  return res.data;
};

export const createBed = async (payload) => {
  const res = await API.post('/censo-camas', payload);
  return res.data;
};

export const updateBed = async (id, payload) => {
  const res = await API.put(`/censo-camas/${id}`, payload);
  return res.data;
};
