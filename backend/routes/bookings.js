const express = require('express');
const { check } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const router = express.Router();
const { getBookings, createBooking, updateBooking, deleteBooking, getBookingMetrics, getPatientSummaries } = require('../controllers/bookingController');

router.get('/', authMiddleware, authorize('admin', 'superadmin', 'secretaria', 'medico', 'enfermero', 'paciente'), getBookings);
router.get('/metrics', authMiddleware, authorize('admin', 'superadmin'), getBookingMetrics);
router.get('/patient-summaries', authMiddleware, authorize('admin', 'superadmin', 'secretaria'), getPatientSummaries);
router.post(
  '/',
  [
    check('usuario', 'Usuario es obligatorio').isMongoId(),
    check('servicio', 'Servicio es obligatorio').isMongoId(),
    check('medico', 'Profesional es obligatorio').isMongoId(),
    check('fecha', 'Fecha es obligatoria').isISO8601().toDate(),
    check('hora', 'Hora es obligatoria').notEmpty(),
    check('fechaHoraReserva', 'FechaHoraReserva es obligatoria').isISO8601().toDate(),
  ],
  validateRequest,
  createBooking
);
router.put('/:id',
  authMiddleware,
  authorize('admin', 'superadmin', 'secretaria'),
  [
    check('id', 'ID inválido').isMongoId(),
    check('medico').optional().isMongoId(),
    check('servicio').optional().isMongoId(),
    check('fecha').optional().isISO8601().toDate(),
    check('hora').optional().notEmpty(),
    check('estado').optional().isIn(['pendiente', 'confirmada', 'cancelada', 'reprogramada', 'ausente', 'atendida'])
  ],
  validateRequest,
  updateBooking
);
router.delete('/:id', authMiddleware, authorize('admin', 'superadmin', 'secretaria'), deleteBooking);

module.exports = router;
