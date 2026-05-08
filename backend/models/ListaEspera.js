const mongoose = require('mongoose');

// Lista de espera cuando no hay turnos disponibles
const listaEsperaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },

  prioridad: {
    type: String,
    enum: ['urgente', 'alta', 'media', 'baja'],
    default: 'media',
    index: true,
  },

  motivoConsulta: { type: String, default: '', maxlength: 300 },
  fechaSolicitud: { type: Date, default: Date.now, index: true },

  estado: {
    type: String,
    enum: ['en_espera', 'notificado', 'asignado', 'cancelado'],
    default: 'en_espera',
    index: true,
  },

  // Cuando se le asigna un turno
  turnoAsignado: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  fechaAsignacion: { type: Date },

  // Notificaciones enviadas
  notificaciones: [{
    canal: { type: String, enum: ['email', 'sms', 'whatsapp', 'push'], default: 'email' },
    fecha: { type: Date, default: Date.now },
    estado: { type: String, enum: ['enviado', 'fallido'], default: 'enviado' },
  }],

  // Preferencias del paciente
  preferencias: {
    diasDisponibles: [{ type: String }],   // ['lunes', 'miercoles', 'viernes']
    horarioPreferido: { type: String, default: '' },
  },

  notas: { type: String, default: '', maxlength: 300 },
}, { timestamps: true });

listaEsperaSchema.index({ medico: 1, estado: 1, prioridad: 1, fechaSolicitud: 1 });
listaEsperaSchema.index({ paciente: 1, estado: 1 });

module.exports = mongoose.model('ListaEspera', listaEsperaSchema);
