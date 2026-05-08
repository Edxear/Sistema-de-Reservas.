const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/reportesController');

router.get('/kpis', auth, authorize('admin', 'superadmin', 'secretaria', 'medico', 'enfermero'), ctrl.kpisEjecutivos);
router.get('/produccion-medicos', auth, authorize('admin', 'superadmin', 'secretaria'), ctrl.produccionMedicos);
router.get('/ocupacion-camas', auth, authorize('admin', 'superadmin', 'secretaria', 'enfermero'), ctrl.ocupacionCamas);
router.get('/top-diagnosticos', auth, authorize('admin', 'superadmin', 'medico'), ctrl.topDiagnosticos);
router.get('/laboratorio', auth, authorize('admin', 'superadmin', 'medico', 'enfermero'), ctrl.resumenLaboratorio);
router.get('/finanzas', auth, authorize('admin', 'superadmin', 'secretaria'), ctrl.indicadoresFinancieros);

module.exports = router;
