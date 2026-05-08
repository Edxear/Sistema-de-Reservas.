const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/hceController');

router.get('/pacientes/:pacienteId/resumen', auth, ctrl.resumenPaciente);
router.get('/pacientes/:pacienteId/timeline', auth, ctrl.timeline);

router.get('/pacientes/:pacienteId/problemas', auth, ctrl.listarProblemas);
router.post('/pacientes/:pacienteId/problemas', auth, authorize('medico', 'enfermero', 'admin', 'superadmin'), ctrl.crearProblema);
router.put('/problemas/:id', auth, authorize('medico', 'enfermero', 'admin', 'superadmin'), ctrl.actualizarProblema);
router.patch('/problemas/:id/resolver', auth, authorize('medico', 'admin', 'superadmin'), ctrl.resolverProblema);

router.get('/pacientes/:pacienteId/alergias', auth, ctrl.listarAlergias);
router.post('/pacientes/:pacienteId/alergias', auth, authorize('medico', 'enfermero', 'admin', 'superadmin'), ctrl.crearAlergia);
router.put('/alergias/:id', auth, authorize('medico', 'enfermero', 'admin', 'superadmin'), ctrl.actualizarAlergia);

module.exports = router;
