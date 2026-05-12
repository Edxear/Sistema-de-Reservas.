const express = require('express');
const router = express.Router();
const nutricionController = require('../controllers/nutricionController');
const auth = require('../middleware/auth');

router.post('/', auth, nutricionController.crearNutricion);
router.get('/', auth, nutricionController.obtenerNutriciones);
router.put('/:id', auth, nutricionController.actualizarNutricion);
router.get('/metricas', auth, nutricionController.obtenerMetricas);

module.exports = router;
