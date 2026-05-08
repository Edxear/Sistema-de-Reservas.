const mongoose = require('mongoose');

// Episodio de ingreso a UCI/UTI
const episodioUCISchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  admision: { type: mongoose.Schema.Types.ObjectId, ref: 'Admision', default: null },
  cama: { type: mongoose.Schema.Types.ObjectId, ref: 'BedUnit', required: true },
  medicoResponsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  fechaIngreso: { type: Date, default: Date.now, index: true },
  fechaEgreso: { type: Date },
  motivoIngreso: { type: String, required: true, maxlength: 500 },
  diagnosticoIngreso: { type: String, default: '', maxlength: 300 },

  estado: {
    type: String,
    enum: ['activo', 'egresado', 'fallecido', 'traslado'],
    default: 'activo',
    index: true,
  },

  // Escalas de gravedad al ingreso
  apacheII: { type: Number },
  sofa: { type: Number },

  // Ventilación mecánica
  ventilacionMecanica: { type: Boolean, default: false },
  fechaIntubacion: { type: Date },
  fechaExtubacion: { type: Date },

  observaciones: { type: String, default: '', maxlength: 600 },
}, { timestamps: true });

episodioUCISchema.index({ paciente: 1, fechaIngreso: -1 });
episodioUCISchema.index({ estado: 1 });

module.exports = mongoose.model('EpisodioUCI', episodioUCISchema);
