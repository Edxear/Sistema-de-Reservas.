const express = require('express');
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { agendaOwnerOrAdmin, medicoOrAdmin } = require('../middleware/agendaAuth');
const router = express.Router();

const {
  getDisponibilidad,
  getProximasFechas,
  createOrUpdateAgenda,
  deleteAgendaDia,
  createExcepcion,
  getExcepciones,
  deleteExcepcion,
  getAgendaSemanal
} = require('../controllers/agendaMedicaController');

// GET: Obtener disponibilidad (público, sin autenticación)
router.get('/medicos/:id/disponibilidad', getDisponibilidad);

// GET: Obtener próximas fechas disponibles (público)
router.get('/medicos/:id/proximas-fechas', getProximasFechas);

// GET: Obtener agenda semanal (público)
router.get('/medicos/:id/agenda/semanal', getAgendaSemanal);

// POST: Crear/actualizar agenda semanal (requiere auth + admin o médico propietario)
router.post(
  '/medicos/:id/agenda',
  auth,
  agendaOwnerOrAdmin,
  [
    check('horarios', 'horarios debe ser un array').isArray(),
    check('horarios.*.dia', 'dia debe estar entre 0 y 6').optional().isInt({ min: 0, max: 6 }),
    check('horarios.*.horaInicio', 'horaInicio inválida').optional().matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/),
    check('horarios.*.horaFin', 'horaFin inválida').optional().matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
  ],
  validateRequest,
  createOrUpdateAgenda
);

// DELETE: Eliminar día de agenda (requiere auth + permisos)
router.delete(
  '/medicos/:id/agenda/:dia',
  auth,
  agendaOwnerOrAdmin,
  [
    check('dia', 'dia inválida').isInt({ min: 0, max: 6 })
  ],
  validateRequest,
  deleteAgendaDia
);

// POST: Crear excepción (requiere auth + permisos)
router.post(
  '/medicos/:id/excepciones',
  auth,
  agendaOwnerOrAdmin,
  [
    check('fecha', 'fecha es obligatoria y debe ser válida').isISO8601().toDate(),
    check('tipoExcepcion', 'tipoExcepcion debe ser válida').isIn([
      'franco', 'feriado', 'cierre_oficina', 'horario_especial', 'reunion', 'capacitacion', 'otra'
    ]),
    check('horaInicio', 'horaInicio debe tener formato HH:mm').optional().matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/),
    check('horaFin', 'horaFin debe tener formato HH:mm').optional().matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/),
    check('razon', 'razon debe ser string').optional().isString()
  ],
  validateRequest,
  createExcepcion
);

// GET: Obtener excepciones de un médico (requiere auth)
router.get(
  '/medicos/:id/excepciones',
  auth,
  medicoOrAdmin,
  getExcepciones
);

// DELETE: Eliminar excepción (requiere auth + permisos)
router.delete(
  '/medicos/:id/excepciones/:excepcionId',
  auth,
  agendaOwnerOrAdmin,
  [
    check('excepcionId', 'excepcionId debe ser un MongoDB ID válido').isMongoId()
  ],
  validateRequest,
  deleteExcepcion
);

module.exports = router;
