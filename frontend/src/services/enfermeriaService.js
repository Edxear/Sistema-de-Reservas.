import API from './api';

export const getNursingCatalog = async () => {
  const res = await API.get('/enfermeria/catalog');
  return res.data;
};

export const getNursingDashboard = async (params = {}) => {
  const res = await API.get('/enfermeria/dashboard', { params });
  return res.data;
};

export const getNursingOrganigrama = async () => {
  const res = await API.get('/enfermeria/organigrama');
  return res.data;
};

export const listNursingInitiatives = async (params = {}) => {
  const res = await API.get('/enfermeria/initiatives', { params });
  return res.data;
};

export const createNursingInitiative = async (payload) => {
  const res = await API.post('/enfermeria/initiatives', payload);
  return res.data;
};

export const updateNursingInitiative = async (id, payload) => {
  const res = await API.put(`/enfermeria/initiatives/${id}`, payload);
  return res.data;
};

export const listNursingChecklists = async (params = {}) => {
  const res = await API.get('/enfermeria/checklists', { params });
  return res.data;
};

export const createNursingChecklist = async (payload) => {
  const res = await API.post('/enfermeria/checklists', payload);
  return res.data;
};

export const listNursingIncidents = async (params = {}) => {
  const res = await API.get('/enfermeria/incidents', { params });
  return res.data;
};

export const createNursingIncident = async (payload) => {
  const res = await API.post('/enfermeria/incidents', payload);
  return res.data;
};

export const updateNursingIncidentStatus = async (id, payload) => {
  const res = await API.put(`/enfermeria/incidents/${id}/status`, payload);
  return res.data;
};
