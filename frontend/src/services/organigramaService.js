import API from './api';

export const getOrganigrama = async (onlyActive = false) => {
  const res = await API.get('/organigrama', { params: { onlyActive } });
  return res.data;
};

export const createOrganigrama = async (data) => {
  const res = await API.post('/organigrama', data);
  return res.data;
};

export const updateOrganigrama = async (id, data) => {
  const res = await API.put(`/organigrama/${id}`, data);
  return res.data;
};

export const reorderOrganigrama = async (items) => {
  const res = await API.put('/organigrama/reorder', { items });
  return res.data;
};

export const deleteOrganigrama = async (id) => {
  const res = await API.delete(`/organigrama/${id}`);
  return res.data;
};
