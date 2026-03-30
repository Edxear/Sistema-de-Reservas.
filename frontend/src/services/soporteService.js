import API from './api';

export const getSupportUsers = async (params = {}) => {
  const res = await API.get('/users', { params });
  return res.data;
};

export const updateSupportUser = async (id, payload) => {
  const res = await API.put(`/users/${id}`, payload);
  return res.data;
};

export const deleteSupportUser = async (id) => {
  const res = await API.delete(`/users/${id}`);
  return res.data;
};

export const getPrivateComments = async (targetUserId) => {
  const res = await API.get(`/comentarios-privados/medico/${targetUserId}`);
  return res.data;
};

export const createPrivateComment = async (targetUserId, contenido) => {
  const res = await API.post(`/comentarios-privados/medico/${targetUserId}`, { contenido });
  return res.data;
};

export const getColleagueRatingSummary = async (targetUserId) => {
  const res = await API.get(`/colleague-ratings/user/${targetUserId}/summary`);
  return res.data;
};

export const submitColleagueRating = async (targetUserId, payload) => {
  const res = await API.post(`/colleague-ratings/user/${targetUserId}`, payload);
  return res.data;
};

export const deleteColleagueRating = async (ratingId) => {
  const res = await API.delete(`/colleague-ratings/${ratingId}`);
  return res.data;
};

export const getSupportBlueprint = async () => {
  const res = await API.get('/support/blueprint');
  return res.data;
};

export const getSupportMetrics = async () => {
  const res = await API.get('/support/metrics');
  return res.data;
};

export const listSupportTickets = async (params = {}) => {
  const res = await API.get('/support/tickets', { params });
  return res.data;
};

export const createSupportTicket = async (payload) => {
  const res = await API.post('/support/tickets', payload);
  return res.data;
};

export const updateSupportTicket = async (id, payload) => {
  const res = await API.put(`/support/tickets/${id}`, payload);
  return res.data;
};

export const submitSupportSurvey = async (id, payload) => {
  const res = await API.post(`/support/tickets/${id}/survey`, payload);
  return res.data;
};
