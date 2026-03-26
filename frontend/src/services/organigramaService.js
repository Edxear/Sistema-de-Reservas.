import API from './api';

export const getOrganigrama = async ({
  onlyActive,
  status = 'todos',
  q = '',
  page = 1,
  limit = 12,
} = {}) => {
  const params = { status, q, page, limit };
  if (typeof onlyActive === 'boolean') {
    params.onlyActive = onlyActive;
  }
  const res = await API.get('/organigrama', { params });
  return res.data;
};

export const getOrganigramaAudit = async ({ page = 1, limit = 10 } = {}) => {
  const res = await API.get('/organigrama/audit', { params: { page, limit } });
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
