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

export const getNursingWorkload = async () => {
  const res = await API.get('/enfermeria/workload');
  return res.data;
};

export const createAyudaRapida = async (payload) => {
  const res = await API.post('/enfermeria/ayuda-rapida', payload);
  return res.data;
};

export const getNursingConfig = async () => {
  const res = await API.get('/enfermeria/config');
  return res.data;
};

export const updateNursingConfig = async (payload) => {
  const res = await API.put('/enfermeria/config', payload);
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

export const listNursingContacts = async (params = {}) => {
  const res = await API.get('/enfermeria/contacts', { params });
  return res.data;
};

export const listNursingWoundPhotos = async (params = {}) => {
  const res = await API.get('/enfermeria/wound-photos', { params });
  return res.data;
};

export const createNursingWoundPhoto = async (payload) => {
  const res = await API.post('/enfermeria/wound-photos', payload);
  return res.data;
};

export const updateNursingWoundPhoto = async (id, payload) => {
  const res = await API.put(`/enfermeria/wound-photos/${id}`, payload);
  return res.data;
};

export const listNursingShiftTasks = async (params = {}) => {
  const res = await API.get('/enfermeria/shift-tasks', { params });
  return res.data;
};

export const generateNursingShiftTasks = async (payload) => {
  const res = await API.post('/enfermeria/shift-tasks/generate', payload);
  return res.data;
};

export const updateNursingShiftTask = async (id, payload) => {
  const res = await API.patch(`/enfermeria/shift-tasks/${id}`, payload);
  return res.data;
};

export const listNursingHandoffs = async (params = {}) => {
  const res = await API.get('/enfermeria/handoffs', { params });
  return res.data;
};

export const createNursingHandoff = async (payload) => {
  const res = await API.post('/enfermeria/handoffs', payload);
  return res.data;
};

export const updateNursingHandoffStatus = async (id, payload) => {
  const res = await API.patch(`/enfermeria/handoffs/${id}/status`, payload);
  return res.data;
};
