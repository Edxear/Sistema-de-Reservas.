const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getPorPaciente,
  getLongitudinalPorPaciente,
  crearRegistro,
} = require('../controllers/historiaClinicaController');

// Medicos, admins y secretarias pueden consultar historias por paciente
router.get('/paciente/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero'), getPorPaciente);
router.get('/paciente/:pacienteId/longitudinal', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero'), getLongitudinalPorPaciente);
router.post('/', authMiddleware, authorize('medico', 'admin', 'enfermero'), crearRegistro);

module.exports = router;
