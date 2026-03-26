const express = require('express');
const router = express.Router();
const { 
  getRatingsPorMedico, 
  crearOActualizarRating,
  miRatingPorMedico,
  eliminarRating
} = require('../controllers/ratingController');
const auth = require('../middleware/auth');

/**
 * GET /api/v1/ratings/medico/:medicoId
 * Obtener todos los ratings de un médico (público)
 */
router.get('/medico/:medicoId', getRatingsPorMedico);

/**
 * GET /api/v1/ratings/mio/:medicoId
 * Obtener mi rating para un médico específico (requiere auth)
 */
router.get('/mio/:medicoId', auth, miRatingPorMedico);

/**
 * POST /api/v1/ratings/medico/:medicoId
 * Crear o actualizar un rating (requiere auth)
 */
router.post('/medico/:medicoId', auth, crearOActualizarRating);

/**
 * DELETE /api/v1/ratings/:ratingId
 * Eliminar un rating (requiere auth + ser dueño)
 */
router.delete('/:ratingId', auth, eliminarRating);

module.exports = router;
