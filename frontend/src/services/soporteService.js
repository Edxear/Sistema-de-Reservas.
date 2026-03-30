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
