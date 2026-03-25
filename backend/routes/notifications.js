const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const auth = require('../middleware/auth');

/**
 * GET /api/notificaciones
 * Obtiene notificaciones del usuario (auth requerido)
 * Query params: leido=false (solo no leídas), limite=50
 */
router.get('/', auth, notificacionController.getNotificaciones);

/**
 * PUT /api/notificaciones/:id
 * Marca una notificación como leída
 */
router.put('/:id', auth, notificacionController.marcarComoLeida);

/**
 * PATCH /api/notificaciones/marcar-todas-leidas
 * Marca todas las notificaciones del usuario como leídas
 */
router.patch('/marcar-todas-leidas', auth, notificacionController.marcarTodoComoLeido);

module.exports = router;
