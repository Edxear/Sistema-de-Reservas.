const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/admisionController');

router.get('/pacientes/buscar', auth, ctrl.buscarPaciente);
router.post('/', auth, authorize('admin', 'secretaria', 'enfermero', 'medico', 'superadmin'), ctrl.crearAdmision);
router.get('/', auth, authorize('admin', 'secretaria', 'enfermero', 'medico', 'superadmin'), ctrl.listarAdmisiones);
router.get('/ocupacion', auth, authorize('admin', 'secretaria', 'enfermero', 'medico', 'superadmin'), ctrl.ocupacionActual);
router.get('/:id', auth, ctrl.obtenerAdmision);
router.patch('/:id/alta', auth, authorize('admin', 'medico', 'superadmin'), ctrl.darAlta);
router.post('/:id/pulsera', auth, authorize('admin', 'secretaria', 'enfermero', 'superadmin'), ctrl.generarPulsera);

module.exports = router;
