import API from './api';

export const getDoctors = async () => {
  const res = await API.get('/doctors');
  return res.data;
};

export const createAppointment = async (appointmentData) => {
  const res = await API.post('/appointments', appointmentData);
  return res.data;
};
