const express = require('express');
const { check } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const router = express.Router();
const { getBookings, createBooking, updateBooking, deleteBooking, getBookingMetrics, getPatientSummaries } = require('../controllers/bookingController');

router.get('/', getBookings);
router.get('/metrics', getBookingMetrics);
router.get('/patient-summaries', getPatientSummaries);
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
router.delete('/:id', deleteBooking);

module.exports = router;
