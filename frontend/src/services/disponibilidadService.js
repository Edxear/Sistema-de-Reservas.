import api from './api';

/**
 * Obtiene slots disponibles para una fecha específica y duración
 * @param {string} medicoId - ID del médico
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {number} duracion - Duración en minutos (default: 30)
 * @returns {Promise} { slots: ['09:00', '09:30', ...] }
 */
export const getDisponibilidad = async (medicoId, fecha, duracion = 30, excludeBookingId = '') => {
  try {
    const response = await api.get(`/medicos/${medicoId}/disponibilidad`, {
      params: { fecha, duracion, excludeBookingId }
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error.message);
    throw error;
  }
};

/**
 * Obtiene las próximas fechas con disponibilidad
 * @param {string} medicoId - ID del médico
 * @param {number} dias - Cuántos días adelante buscar (default: 45)
 * @returns {Promise} { fechas: [{value, label, slots}, ...] }
 */
export const getProximasFechas = async (medicoId, dias = 45) => {
  try {
    const response = await api.get(`/medicos/${medicoId}/proximas-fechas`, {
      params: { dias }
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo próximas fechas:', error.message);
    throw error;
  }
};

/**
 * Obtiene la agenda semanal del médico (horarios fijos)
 * @param {string} medicoId - ID del médico
 * @returns {Promise} { schedule: { lunes: [...], martes: [...], ... } }
 */
export const getAgendaSemanal = async (medicoId) => {
  try {
    const response = await api.get(`/medicos/${medicoId}/agenda/semanal`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo agenda semanal:', error.message);
    throw error;
  }
};

/**
 * Crea o actualiza la agenda de un médico
 * @param {string} medicoId - ID del médico
 * @param {array} horarios - Array de horarios
 * @returns {Promise}
 */
export const crearActualizarAgenda = async (medicoId, horarios) => {
  try {
    const response = await api.post(`/medicos/${medicoId}/agenda`, { horarios });
    return response.data;
  } catch (error) {
    console.error('Error actualizando agenda:', error.message);
    throw error;
  }
};

/**
 * Elimina un día de la agenda del médico
 * @param {string} medicoId - ID del médico
 * @param {number} dia - Número de día (0-6)
 * @returns {Promise}
 */
export const eliminarDiaAgenda = async (medicoId, dia) => {
  try {
    const response = await api.delete(`/medicos/${medicoId}/agenda/${dia}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando día de agenda:', error.message);
    throw error;
  }
};

/**
 * Crea una excepción (franco, feriado, etc.)
 * @param {string} medicoId - ID del médico
 * @param {object} excepcion - { fecha, tipoExcepcion, horaInicio?, horaFin?, razon? }
 * @returns {Promise}
 */
export const crearExcepcion = async (medicoId, excepcion) => {
  try {
    const response = await api.post(`/medicos/${medicoId}/excepciones`, excepcion);
    return response.data;
  } catch (error) {
    console.error('Error creando excepción:', error.message);
    throw error;
  }
};

/**
 * Obtiene las excepciones de un médico
 * @param {string} medicoId - ID del médico
 * @param {string} fechaInicio - Fecha inicio (opcional)
 * @param {string} fechaFin - Fecha fin (opcional)
 * @returns {Promise} { excepciones: [...], total: number }
 */
export const getExcepciones = async (medicoId, fechaInicio = null, fechaFin = null) => {
  try {
    const params = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;

    const response = await api.get(`/medicos/${medicoId}/excepciones`, { params });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo excepciones:', error.message);
    throw error;
  }
};

/**
 * Elimina una excepción
 * @param {string} medicoId - ID del médico
 * @param {string} excepcionId - ID de la excepción
 * @returns {Promise}
 */
export const eliminarExcepcion = async (medicoId, excepcionId) => {
  try {
    const response = await api.delete(`/medicos/${medicoId}/excepciones/${excepcionId}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando excepción:', error.message);
    throw error;
  }
};

export default {
  getDisponibilidad,
  getProximasFechas,
  getAgendaSemanal,
  crearActualizarAgenda,
  eliminarDiaAgenda,
  crearExcepcion,
  getExcepciones,
  eliminarExcepcion
};
