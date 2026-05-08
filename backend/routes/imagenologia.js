const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/imagenologiaController');

// Catálogo
router.get('/estudios', auth, ctrl.listarEstudios);
router.post('/estudios', auth, authorize('admin', 'superadmin', 'medico'), ctrl.crearEstudio);

// Solicitudes
router.post('/solicitudes', auth, authorize('admin', 'medico'), ctrl.crearSolicitud);
router.get('/solicitudes/paciente/:id', auth, ctrl.listarSolicitudesPaciente);
router.patch('/solicitudes/:id/turno', auth, authorize('admin', 'superadmin', 'secretaria', 'medico'), ctrl.agendarTurno);
router.patch('/solicitudes/:id/informe', auth, authorize('admin', 'superadmin', 'medico'), ctrl.cargarInforme);
router.patch('/solicitudes/:id/firmar', auth, authorize('admin', 'superadmin', 'medico'), ctrl.firmarInforme);

// Agenda por equipo
router.get('/agenda', auth, ctrl.agendaEquipo);

module.exports = router;
