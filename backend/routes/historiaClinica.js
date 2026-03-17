const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getPorPaciente,
  crearRegistro,
} = require('../controllers/historiaClinicaController');

// Sólo médicos y admins pueden acceder
router.get('/paciente/:pacienteId', authMiddleware, authorize('medico', 'admin'), getPorPaciente);
router.post('/', authMiddleware, authorize('medico', 'admin'), crearRegistro);

module.exports = router;
