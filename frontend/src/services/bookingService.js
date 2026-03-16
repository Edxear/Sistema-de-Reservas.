import API from './api';

export const getBookings = (config = {}) => API.get('/bookings', config);
export const createBooking = (data, config = {}) => API.post('/bookings', data, config);
export const updateBooking = (id, data, config = {}) => API.put(`/bookings/${id}`, data, config);
export const deleteBooking = (id, config = {}) => API.delete(`/bookings/${id}`, config);
