const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/inventarioController');

router.get('/insumos', auth, ctrl.listarInsumos);
router.post('/insumos', auth, authorize('admin', 'superadmin'), ctrl.crearInsumo);
router.put('/insumos/:id', auth, authorize('admin', 'superadmin'), ctrl.actualizarInsumo);

router.post('/movimientos', auth, authorize('admin', 'superadmin', 'enfermero'), ctrl.registrarMovimiento);
router.get('/kardex/:insumoId', auth, ctrl.kardex);

router.get('/equipos', auth, ctrl.listarEquipos);
router.post('/equipos', auth, authorize('admin', 'superadmin'), ctrl.crearEquipo);
router.put('/equipos/:id', auth, authorize('admin', 'superadmin'), ctrl.actualizarEquipo);

router.get('/mantenimientos', auth, ctrl.listarMantenimientos);
router.post('/mantenimientos', auth, authorize('admin', 'superadmin'), ctrl.crearMantenimiento);
router.patch('/mantenimientos/:id/completar', auth, authorize('admin', 'superadmin'), ctrl.completarMantenimiento);
router.get('/alertas/mantenimiento', auth, ctrl.equiposPorVencer);

module.exports = router;
