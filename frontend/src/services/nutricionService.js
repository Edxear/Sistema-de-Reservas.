import API from './api';

export const getNutricionDb = async () => {
  const { data } = await API.get('/nutricion/db');
  return data;
};

export const getNutricionMetricas = async () => {
  const { data } = await API.get('/nutricion/metricas');
  return data;
};

export const listNutricionPacientes = async () => {
  const { data } = await API.get('/nutricion/pacientes');
  return data;
};

export const createNutricionPaciente = async (payload) => {
  const { data } = await API.post('/nutricion/pacientes', payload);
  return data;
};

export const getNutricionPaciente = async (pacienteId) => {
  const { data } = await API.get(`/nutricion/pacientes/${pacienteId}`);
  return data;
};

export const updateHistoriaClinica = async (pacienteId, payload) => {
  const { data } = await API.put(`/nutricion/pacientes/${pacienteId}/clinico`, payload);
  return data;
};

export const addProcesoNutricion = async (pacienteId, payload) => {
  const { data } = await API.post(`/nutricion/pacientes/${pacienteId}/procesos`, payload);
  return data;
};

export const addDietaNutricion = async (pacienteId, payload) => {
  const { data } = await API.post(`/nutricion/pacientes/${pacienteId}/dietas`, payload);
  return data;
};

export const addAlergiaNutricion = async (pacienteId, payload) => {
  const { data } = await API.post(`/nutricion/pacientes/${pacienteId}/alergias`, payload);
  return data;
};

export const addPedidoCocina = async (pacienteId, payload) => {
  const { data } = await API.post(`/nutricion/pacientes/${pacienteId}/cocina`, payload);
  return data;
};

export const updateEstadoOperativoNutricion = async (payload) => {
  const { data } = await API.put('/nutricion/estado-operativo', payload);
  return data;
};
