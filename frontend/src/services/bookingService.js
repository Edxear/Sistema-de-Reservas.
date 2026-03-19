import API from './api';

export const getBookings = (params = {}) => API.get('/bookings', { params });
export const getBookingMetrics = (period = '7d') => API.get('/bookings/metrics', { params: { period } });
export const getPatientSummaries = () => API.get('/bookings/patient-summaries');
export const createBooking = (data) => API.post('/bookings', data);
export const updateBooking = (id, data) => API.put(`/bookings/${id}`, data);
export const deleteBooking = (id) => API.delete(`/bookings/${id}`);