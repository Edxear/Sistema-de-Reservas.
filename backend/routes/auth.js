const express = require('express');
const { check } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const { authLimiter } = require('../middleware/rateLimiter');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { registerUser, loginUser, getMyProfile, updateMyProfile, logoutUser } = require('../controllers/authController');


router.post(
  '/register',
  authLimiter,
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
  authLimiter,
  [
    check('email', 'Email válido es obligatorio').isEmail(),
    check('password', 'La contraseña es obligatoria').exists()
  ],
  validateRequest,
  loginUser
);

router.get('/me', authMiddleware, getMyProfile);
router.put('/me', authMiddleware, updateMyProfile);
router.post('/logout', logoutUser);

module.exports = router;
