const express = require('express');
const { check } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const router = express.Router();
const { getBookings, createBooking, updateBooking, deleteBooking } = require('../controllers/bookingController');

router.get('/', getBookings);
router.post(
  '/',
  [
    check('usuario', 'Usuario es obligatorio').isMongoId(),
    check('servicio', 'Servicio es obligatorio').isMongoId(),
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
    check('estado').optional().isIn(['pendiente', 'confirmada', 'cancelada', 'completada'])
  ],
  validateRequest,
  updateBooking
);
router.delete('/:id', deleteBooking);

module.exports = router;
