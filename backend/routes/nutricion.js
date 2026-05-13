const express = require('express');
const router = express.Router();
const nutricionController = require('../controllers/nutricionController');
const auth = require('../middleware/auth');

router.get('/db', auth, nutricionController.obtenerBaseNutricion);
router.get('/metricas', auth, nutricionController.obtenerMetricas);
router.put('/estado-operativo', auth, nutricionController.cambiarEstadoOperativo);

router.get('/pacientes', auth, nutricionController.listarPacientes);
router.post('/pacientes', auth, nutricionController.crearPaciente);
router.get('/pacientes/:pacienteId', auth, nutricionController.obtenerPaciente);
router.put('/pacientes/:pacienteId/clinico', auth, nutricionController.actualizarHistoriaClinica);
router.post('/pacientes/:pacienteId/procesos', auth, nutricionController.agregarProceso);
router.post('/pacientes/:pacienteId/dietas', auth, nutricionController.agregarDieta);
router.post('/pacientes/:pacienteId/alergias', auth, nutricionController.agregarAlergia);
router.post('/pacientes/:pacienteId/cocina', auth, nutricionController.agregarPedidoCocina);

module.exports = router;
