const express = require('express');
const router = express.Router();
const { crearPreferencia, webhook } = require('../controllers/pagoController');
const authMiddleware = require('../middleware/auth');

// POST /api/pagos/crear-preferencia  — autenticado
router.post('/crear-preferencia', authMiddleware, crearPreferencia);

// POST /api/pagos/webhook — llamado por Mercado Pago (sin auth)
router.post('/webhook', webhook);

module.exports = router;
