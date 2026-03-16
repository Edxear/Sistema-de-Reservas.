const express = require('express');
const { check } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const router = express.Router();
const { registerPatient, loginPatient } = require('../controllers/authController');

router.post(
  '/register',
  [
    check('name', 'El nombre es obligatorio').notEmpty(),
    check('email', 'Email válido es obligatorio').isEmail(),
    check('phone', 'Teléfono es obligatorio').notEmpty(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 })
  ],
  validateRequest,
  registerPatient
);

router.post(
  '/login',
  [
    check('email', 'Email válido es obligatorio').isEmail(),
    check('password', 'La contraseña es obligatoria').exists()
  ],
  validateRequest,
  loginPatient
);

module.exports = router;
