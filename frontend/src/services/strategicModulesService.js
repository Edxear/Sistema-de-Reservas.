import API from './api';

export const getStrategicModulesSummary = async () => {
  const response = await API.get('/strategic-modules');
  return response.data;
};

export const getStrategicModuleDetail = async (slug) => {
  const response = await API.get(`/strategic-modules/${slug}`);
  return response.data;
};