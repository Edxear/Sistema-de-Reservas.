import API from './api';

export const listOrdenesMedicas = async (params = {}) => {
  const res = await API.get('/ordenes-medicas', { params });
  return res.data;
};

export const getOrdenesPorPaciente = async (pacienteId, params = {}) => {
  const res = await API.get(`/ordenes-medicas/paciente/${pacienteId}`, { params });
  return res.data;
};

export const crearOrdenMedica = async (payload) => {
  const res = await API.post('/ordenes-medicas', payload);
  return res.data;
};

export const actualizarEstadoOrden = async (id, payload) => {
  const res = await API.put(`/ordenes-medicas/${id}/estado`, payload);
  return res.data;
};

export const buscarUsuarios = async (params = {}) => {
  const res = await API.get('/users/buscar', { params });
  return res.data;
};
