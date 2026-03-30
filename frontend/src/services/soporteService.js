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

export const getColleagueRatingSummaryByType = async (targetUserId, feedbackType) => {
  const res = await API.get(`/colleague-ratings/user/${targetUserId}/summary`, {
    params: { feedbackType },
  });
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

export const getColleagueFeedbackFramework = async () => {
  const res = await API.get('/colleague-ratings/framework');
  return res.data;
};

export const listFormalColleagueFeedback = async (params = {}) => {
  const res = await API.get('/colleague-ratings/records', { params });
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

export const getSupportAdvancedMetrics = async () => {
  const res = await API.get('/support/metrics/advanced');
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

export const listBedCensus = async (params = {}) => {
  const res = await API.get('/censo-camas', { params });
  return res.data;
};

export const createBedUnit = async (payload) => {
  const res = await API.post('/censo-camas', payload);
  return res.data;
};

export const updateBedUnit = async (id, payload) => {
  const res = await API.put(`/censo-camas/${id}`, payload);
  return res.data;
};

export const listSupportKnowledgeArticles = async (params = {}) => {
  const res = await API.get('/support/kb/articles', { params });
  return res.data;
};

export const saveSupportKnowledgeArticle = async (payload) => {
  const res = await API.post('/support/kb/articles', payload);
  return res.data;
};
