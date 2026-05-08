const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/uciController');

router.post('/episodios', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.crearEpisodio);
router.get('/episodios/activos', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.listarActivos);
router.get('/episodios/:id', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.obtenerEpisodio);
router.patch('/episodios/:id/egreso', auth, authorize('admin', 'medico', 'superadmin'), ctrl.egresarPaciente);

router.post('/constantes', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.registrarConstantes);
router.get('/constantes/:episodioId', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.historialConstantes);

router.post('/balance', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.registrarBalance);
router.get('/balance/:episodioId/resumen', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.resumenBalance);

router.post('/escalas', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.registrarEscala);
router.get('/escalas/:episodioId', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.historialEscalas);

router.get('/dashboard', auth, authorize('admin', 'medico', 'enfermero', 'superadmin'), ctrl.dashboardUCI);

module.exports = router;
