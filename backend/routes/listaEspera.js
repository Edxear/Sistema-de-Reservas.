const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/listaEsperaController');

router.post('/', auth, authorize('admin', 'secretaria', 'enfermero', 'medico', 'superadmin', 'paciente'), ctrl.agregar);
router.get('/medico/:medico', auth, authorize('admin', 'secretaria', 'enfermero', 'medico', 'superadmin'), ctrl.listarPorMedico);
router.patch('/:id/asignar', auth, authorize('admin', 'secretaria', 'superadmin'), ctrl.asignarTurno);
router.patch('/:id/cancelar', auth, authorize('admin', 'secretaria', 'medico', 'superadmin', 'paciente'), ctrl.cancelar);

module.exports = router;
