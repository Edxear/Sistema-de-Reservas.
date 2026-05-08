const mongoose = require('mongoose');

// Solicitud de laboratorio generada desde HCE / Órdenes
const solicitudLabSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ordenMedica: { type: mongoose.Schema.Types.ObjectId, ref: 'OrdenMedica', default: null },
  practicas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PracticaLab', required: true }],
  prioridad: {
    type: String,
    enum: ['urgente', 'alta', 'media', 'baja'],
    default: 'media',
    index: true,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'parcial', 'completada', 'cancelada'],
    default: 'pendiente',
    index: true,
  },
  diagnosticoPresuntivo: { type: String, default: '', maxlength: 300 },
  observaciones: { type: String, default: '', maxlength: 500 },
  fechaSolicitud: { type: Date, default: Date.now, index: true },

  // Muestra tomada
  muestra: {
    fechaExtraccion: { type: Date },
    tipo: { type: String, default: '', maxlength: 80 },
    tubo: { type: String, default: '', maxlength: 60 },
    codigoBarras: { type: String, default: '', maxlength: 60 },
    estadoMuestra: {
      type: String,
      enum: ['pendiente', 'tomada', 'en_transito', 'en_proceso', 'analizada'],
      default: 'pendiente',
    },
    tecnicoExtraccion: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
}, { timestamps: true });

solicitudLabSchema.index({ paciente: 1, fechaSolicitud: -1 });
solicitudLabSchema.index({ estado: 1, prioridad: 1 });

module.exports = mongoose.model('SolicitudLab', solicitudLabSchema);
