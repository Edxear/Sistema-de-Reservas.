const authMiddleware = require('../middleware/auth');

const authRoutes = require('./auth');
const doctorRoutes = require('./doctors');
const appointmentRoutes = require('./appointments');
const patientRoutes = require('./patients');
const serviceRoutes = require('./services');
const bookingRoutes = require('./bookings');
const medicoRoutes = require('./medicos');
const historiaClinicaRoutes = require('./historiaClinica');
const recetaRoutes = require('./recetas');
const pagoRoutes = require('./pagos');
const notificacionesRoutes = require('./notifications');
const agendaMedicosRoutes = require('./agendaMedicos');
const organigramaRoutes = require('./organigrama');
const ratingRoutes = require('./ratings');
const comentariosPrivadosRoutes = require('./comentariosPrivados');
const usersRoutes = require('./users');
const colleagueRatingsRoutes = require('./colleagueRatings');
const supportRoutes = require('./support');
const auditLogsRoutes = require('./auditLogs');

function registerApiRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/medicos', medicoRoutes);
  app.use('/api/historia-clinica', historiaClinicaRoutes);
  app.use('/api/recetas', recetaRoutes);
  app.use('/api/bookings', authMiddleware, bookingRoutes);
  app.use('/api/appointments', authMiddleware, appointmentRoutes);
  app.use('/api/pagos', pagoRoutes);
  app.use('/api/notificaciones', notificacionesRoutes);
  app.use('/api', agendaMedicosRoutes);
  app.use('/api/organigrama', organigramaRoutes);
  app.use('/api/ratings', ratingRoutes);
  app.use('/api/comentarios-privados', comentariosPrivadosRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/colleague-ratings', colleagueRatingsRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/audit-logs', auditLogsRoutes);
}

module.exports = {
  registerApiRoutes,
};
