const mongoose = require('mongoose');

// Consentimiento del paciente para compartir datos con organismo receptor
const consentimientoInteropSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  organismoReceptor: { type: String, required: true, maxlength: 120 },
  finalidad: { type: String, default: '', maxlength: 250 },

  fechaInicio: { type: Date, required: true, index: true },
  fechaFin: { type: Date, required: true, index: true },
  activo: { type: Boolean, default: true, index: true },

  firmadoPorPaciente: { type: Boolean, default: true },
  ipFirma: { type: String, default: '' },
  hashEvidencia: { type: String, default: '' },

  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

consentimientoInteropSchema.index({ paciente: 1, organismoReceptor: 1, activo: 1 });

module.exports = mongoose.model('ConsentimientoInterop', consentimientoInteropSchema);
