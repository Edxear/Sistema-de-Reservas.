const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/laboratorioController');

// Catálogo (admin/medico pueden crear/actualizar)
router.get('/practicas', auth, ctrl.listarPracticas);
router.post('/practicas', auth, authorize('admin', 'superadmin', 'medico'), ctrl.crearPractica);
router.put('/practicas/:id', auth, authorize('admin', 'superadmin', 'medico'), ctrl.actualizarPractica);

// Solicitudes
router.post('/solicitudes', auth, authorize('admin', 'medico'), ctrl.crearSolicitud);
router.get('/solicitudes/paciente/:id', auth, ctrl.listarSolicitudesPaciente);
router.patch('/solicitudes/:id/muestra', auth, authorize('admin', 'superadmin', 'enfermero', 'medico'), ctrl.actualizarMuestra);

// Resultados
router.post('/resultados', auth, authorize('admin', 'superadmin', 'medico', 'enfermero'), ctrl.cargarResultado);
router.get('/resultados/paciente/:id', auth, ctrl.listarResultadosPaciente);
router.patch('/resultados/:id/firmar', auth, authorize('admin', 'superadmin', 'medico'), ctrl.firmarResultado);

module.exports = router;
