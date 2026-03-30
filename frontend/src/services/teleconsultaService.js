import API from './api';

export const getMyTeleconsultas = async () => {
  const res = await API.get('/teleconsultas/mis');
  return res.data;
};

export const createTeleconsulta = async (payload) => {
  const res = await API.post('/teleconsultas', payload);
  return res.data;
};

export const updateTeleconsultaStatus = async (id, payload) => {
  const res = await API.put(`/teleconsultas/${id}/estado`, payload);
  return res.data;
};
