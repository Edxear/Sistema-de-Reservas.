const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/facturacionController');

// Prestaciones
router.get('/prestaciones', auth, ctrl.listarPrestaciones);
router.post('/prestaciones', auth, authorize('admin', 'superadmin'), ctrl.crearPrestacion);

// Cargos
router.post('/cargos', auth, authorize('admin', 'superadmin', 'secretaria'), ctrl.crearCargo);
router.get('/cargos/paciente/:id', auth, ctrl.listarCargosPaciente);

// Facturas
router.post('/facturas', auth, authorize('admin', 'superadmin', 'secretaria'), ctrl.generarFactura);
router.get('/facturas/paciente/:id', auth, ctrl.listarFacturasPaciente);
router.get('/facturas/:id', auth, ctrl.obtenerFactura);

// Pagos
router.post('/pagos', auth, authorize('admin', 'superadmin', 'secretaria'), ctrl.registrarPago);

// Reportes
router.get('/reportes/morosidad', auth, authorize('admin', 'superadmin', 'secretaria'), ctrl.reporteMorosidad);

module.exports = router;
