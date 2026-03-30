const express = require('express');

const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { crearOrden, getPorPaciente, actualizarEstado } = require('../controllers/ordenMedicaController');

const router = express.Router();

router.post('/', authMiddleware, authorize('medico', 'admin', 'enfermero'), crearOrden);
router.get('/paciente/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero'), getPorPaciente);
router.put('/:id/estado', authMiddleware, authorize('medico', 'admin', 'enfermero'), actualizarEstado);

module.exports = router;
