import API from './api';

/**
 * Obtener lista de médicos con filtros opcionales
 */
export const getMedicos = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.especialidad) params.append('especialidad', filtros.especialidad);
  if (filtros.search) params.append('search', filtros.search);
  
  const res = await API.get(`/doctors?${params.toString()}`);
  return res.data;
};

/**
 * Obtener detalles de un médico específico
 */
export const getMedicoById = async (id) => {
  const res = await API.get(`/doctors/${id}`);
  return res.data;
};

/**
 * Obtener ratings de un médico
 */
export const getRatingsMedico = async (medicoId) => {
  const res = await API.get(`/ratings/medico/${medicoId}`);
  return res.data;
};

/**
 * Obtener mi rating para un médico específico
 */
export const miRatingMedico = async (medicoId) => {
  const res = await API.get(`/ratings/mio/${medicoId}`);
  return res.data;
};

/**
 * Crear o actualizar un rating para un médico
 */
export const crearRatingMedico = async (medicoId, calificacion, comentario = '') => {
  const res = await API.post(`/ratings/medico/${medicoId}`, {
    pacienteId: null, // El backend lo obtiene del token
    calificacion,
    comentario
  });
  return res.data;
};

/**
 * Eliminar un rating
 */
export const eliminarRating = async (ratingId) => {
  const res = await API.delete(`/ratings/${ratingId}`);
  return res.data;
};

/**
 * Obtener comentarios privados de un médico (admin/director)
 */
export const getComentariosPrivados = async (medicoId) => {
  const res = await API.get(`/comentarios-privados/medico/${medicoId}`);
  return res.data;
};

/**
 * Crear comentario privado para un médico (admin/director)
 */
export const crearComentarioPrivado = async (medicoId, contenido) => {
  const res = await API.post(`/comentarios-privados/medico/${medicoId}`, {
    contenido
  });
  return res.data;
};

/**
 * Actualizar comentario privado
 */
export const actualizarComentarioPrivado = async (comentarioId, contenido) => {
  const res = await API.put(`/comentarios-privados/${comentarioId}`, {
    contenido
  });
  return res.data;
};

/**
 * Eliminar comentario privado
 */
export const eliminarComentarioPrivado = async (comentarioId) => {
  const res = await API.delete(`/comentarios-privados/${comentarioId}`);
  return res.data;
};
