const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { getAppointments, createAppointment, updateAppointmentStatus } = require('../controllers/appointmentController');

router.get('/', authMiddleware, authorize('admin', 'superadmin', 'secretaria', 'medico', 'enfermero'), getAppointments);
router.post('/', authMiddleware, authorize('admin', 'superadmin', 'secretaria'), createAppointment);
router.patch('/:id/status', authMiddleware, authorize('admin', 'superadmin', 'secretaria', 'medico'), updateAppointmentStatus);

module.exports = router;
