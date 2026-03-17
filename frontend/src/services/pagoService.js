import api from './api';

export const crearPreferencia = (bookingId, config) =>
  api.post('/pagos/crear-preferencia', { bookingId }, config);
