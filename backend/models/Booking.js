const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  servicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  medico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fecha: {
    type: Date,
    required: true
  },
  hora: {
    type: String,
    required: true
  },
  fechaHoraReserva: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada', 'reprogramada', 'ausente', 'atendida'],
    default: 'pendiente'
  },
  notas: String,
  motivoEstado: {
    type: String,
    default: ''
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

bookingSchema.index(
  { fecha: 1, hora: 1, medico: 1 },
  { unique: true, partialFilterExpression: { medico: { $exists: true } } }
);

module.exports = mongoose.model('Booking', bookingSchema);
