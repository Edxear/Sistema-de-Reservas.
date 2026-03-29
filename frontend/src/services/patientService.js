import API from './api';

export const getPacientes = async (search = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);

  const query = params.toString();
  const res = await API.get(query ? `/patients?${query}` : '/patients');
  return res.data;
};

export const crearPaciente = async (data) => {
  const res = await API.post('/patients', data);
  return res.data;
};

export const actualizarPaciente = async (id, data) => {
  const res = await API.put(`/patients/${id}`, data);
  return res.data;
};

export const eliminarPaciente = async (id) => {
  const res = await API.delete(`/patients/${id}`);
  return res.data;
};
