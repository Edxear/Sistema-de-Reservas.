const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tipo: {
      type: String,
      enum: [
        'reserva_nueva',
        'reserva_confirmada',
        'reserva_cancelada',
        'reserva_reprogramada',
        'reserva_atendida',
        'receta_nueva',
        'mensaje',
        'pago_confirmado',
      ],
      required: true,
    },
    titulo: {
      type: String,
      required: true,
    },
    mensaje: {
      type: String,
      required: true,
    },
    icono: {
      type: String, // emoji o clase CSS
      default: '📬',
    },
    leido: {
      type: Boolean,
      default: false,
    },
    enlace: {
      type: String, // opcional, ej: '/dashboard#booking-123'
      default: null,
    },
    referencia: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referenciaModelo: {
      type: String,
      enum: ['Booking', 'Mensaje', 'Pago', 'Receta', null],
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'creado',
      updatedAt: false,
    },
  }
);

// Índices para optimización
notificacionSchema.index({ usuario: 1, creado: -1 });
notificacionSchema.index({ usuario: 1, leido: 1 });

module.exports = mongoose.model('Notificacion', notificacionSchema);
