const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  crearReceta,
  getRecetasPaciente,
  getRecetasFavoritas,
} = require('../controllers/recetaController');

// Solo médicos y admins pueden crear recetas y ver recetas de pacientes
router.post('/', authMiddleware, authorize('medico', 'admin'), crearReceta);
router.get('/paciente/:pacienteId', authMiddleware, authorize('medico', 'admin'), getRecetasPaciente);
router.get('/favoritas', authMiddleware, authorize('medico', 'admin'), getRecetasFavoritas);

module.exports = router;
