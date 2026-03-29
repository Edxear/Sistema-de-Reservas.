const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  crearReceta,
  getRecetasPaciente,
  getRecetasFavoritas,
  getMisRecetas,
} = require('../controllers/recetaController');

// Solo médicos y admins pueden crear recetas y ver recetas de pacientes
router.post('/', authMiddleware, authorize('medico', 'admin'), crearReceta);
router.get('/paciente/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria'), getRecetasPaciente);
router.get('/favoritas', authMiddleware, authorize('medico', 'admin'), getRecetasFavoritas);
router.get('/mis', authMiddleware, authorize('paciente'), getMisRecetas);

module.exports = router;
