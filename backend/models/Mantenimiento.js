const mongoose = require('mongoose');

// Registro de mantenimientos preventivos y correctivos de equipos
const mantenimientoSchema = new mongoose.Schema({
  equipo: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true, index: true },
  tipo: {
    type: String,
    enum: ['preventivo', 'correctivo', 'calibracion', 'inspeccion'],
    required: true,
    index: true,
  },
  estado: {
    type: String,
    enum: ['programado', 'en_proceso', 'completado', 'cancelado'],
    default: 'programado',
    index: true,
  },
  fechaProgramada: { type: Date, required: true, index: true },
  fechaInicio: { type: Date },
  fechaFinalizacion: { type: Date },

  tecnico: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  empresa: { type: String, default: '', maxlength: 100 }, // empresa externa de servicio técnico
  costo: { type: Number, default: 0 },

  descripcionFalla: { type: String, default: '', maxlength: 500 }, // para correctivos
  accionesRealizadas: { type: String, default: '', maxlength: 800 },
  repuestosUsados: [{ nombre: String, cantidad: Number }],

  // ¿Se devolvió el equipo a servicio?
  equipoDevuelto: { type: Boolean, default: false },
  fechaDevolucion: { type: Date },

  observaciones: { type: String, default: '', maxlength: 400 },
}, { timestamps: true });

mantenimientoSchema.index({ equipo: 1, fechaProgramada: -1 });
mantenimientoSchema.index({ estado: 1, tipo: 1 });

module.exports = mongoose.model('Mantenimiento', mantenimientoSchema);
