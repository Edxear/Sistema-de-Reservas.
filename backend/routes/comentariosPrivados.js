const express = require('express');
const router = express.Router();
const { 
  getComentariosPorMedico,
  crearComentario,
  actualizarComentario,
  eliminarComentario
} = require('../controllers/comentarioPrivadoController');
const auth = require('../middleware/auth');

/**
 * GET /api/v1/comentarios-privados/medico/:medicoId
 * Obtener comentarios privados de un médico (requiere auth + admin/director)
 */
router.get('/medico/:medicoId', auth, getComentariosPorMedico);

/**
 * POST /api/v1/comentarios-privados/medico/:medicoId
 * Crear un comentario privado (requiere auth + admin/director)
 */
router.post('/medico/:medicoId', auth, crearComentario);

/**
 * PUT /api/v1/comentarios-privados/:comentarioId
 * Actualizar un comentario privado (requiere auth + ser dueño o admin)
 */
router.put('/:comentarioId', auth, actualizarComentario);

/**
 * DELETE /api/v1/comentarios-privados/:comentarioId
 * Eliminar un comentario privado (requiere auth + ser dueño o admin)
 */
router.delete('/:comentarioId', auth, eliminarComentario);

module.exports = router;
