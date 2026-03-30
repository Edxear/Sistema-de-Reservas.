const express = require('express');

const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  createTeleconsulta,
  listMyTeleconsultas,
  updateTeleconsultaStatus,
} = require('../controllers/teleconsultaController');

const router = express.Router();

router.get('/mis', authMiddleware, authorize('paciente', 'medico', 'admin', 'superadmin', 'enfermero', 'secretaria'), listMyTeleconsultas);
router.post('/', authMiddleware, authorize('medico', 'admin', 'superadmin', 'enfermero'), createTeleconsulta);
router.put('/:id/estado', authMiddleware, authorize('medico', 'admin', 'superadmin', 'enfermero'), updateTeleconsultaStatus);

module.exports = router;
