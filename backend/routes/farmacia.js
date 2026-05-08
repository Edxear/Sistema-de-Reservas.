const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/farmaciaController');

// Medicamentos
router.get('/medicamentos', auth, ctrl.listarMedicamentos);
router.post('/medicamentos', auth, authorize('admin', 'superadmin', 'medico'), ctrl.crearMedicamento);

// Stock / lotes
router.get('/lotes', auth, authorize('admin', 'superadmin', 'medico', 'enfermero'), ctrl.listarLotes);
router.post('/lotes', auth, authorize('admin', 'superadmin', 'medico'), ctrl.ingresarLote);
router.get('/stock/:medicamento', auth, ctrl.stockTotal);

// Dispensación
router.post('/dispensaciones', auth, authorize('admin', 'superadmin', 'medico', 'enfermero'), ctrl.dispensar);
router.get('/dispensaciones/paciente/:id', auth, ctrl.historialDispensaciones);

// Interacciones
router.post('/interacciones/verificar', auth, ctrl.verificarInteracciones);

// Alertas
router.get('/alertas/vencimiento', auth, authorize('admin', 'superadmin', 'medico', 'enfermero'), ctrl.alertasVencimiento);

module.exports = router;
