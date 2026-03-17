const express = require('express');
const router = express.Router();
const { getPerfilPublico } = require('../controllers/medicoController');

router.get('/:id/perfil-publico', getPerfilPublico);

module.exports = router;
