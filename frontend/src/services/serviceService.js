import API from './api';

export const getServices = async () => {
  const res = await API.get('/services');
  return res.data;
};

export const createService = async (data) => {
  const res = await API.post('/services', data);
  return res.data;
};

export const updateService = async (id, data) => {
  const res = await API.put(`/services/${id}`, data);
  return res.data;
};

export const deleteService = async (id) => {
  const res = await API.delete(`/services/${id}`);
  return res.data;
};
