const rateLimit = require('express-rate-limit');

/**
 * Rate limiter estricto para endpoints de autenticación.
 * 10 intentos por IP cada 15 minutos.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiados intentos. Intente nuevamente en 15 minutos.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter general para endpoints de creación (tickets, reservas, etc.).
 * 30 solicitudes por IP cada 10 minutos.
 */
const createLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiadas solicitudes. Intente nuevamente en 10 minutos.',
  },
  skipSuccessfulRequests: true,
});

module.exports = { authLimiter, createLimiter };
