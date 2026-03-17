const express = require('express');
const { check } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// routes/historiaClinica.js
router.get('/:pacienteId', authMiddleware, authorize('medico', 'admin'), historiaClinicaController.getByPaciente);

router.post(
  '/register',
  [
    check('nombre', 'El nombre es obligatorio').notEmpty(),
    check('email', 'Email válido es obligatorio').isEmail(),
    check('telefono', 'Teléfono es obligatorio').notEmpty(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 })
  ],
  validateRequest,
  registerUser
);

router.post(
  '/login',
  [
    check('email', 'Email válido es obligatorio').isEmail(),
    check('password', 'La contraseña es obligatoria').exists()
  ],
  validateRequest,
  loginUser
);

module.exports = router;
