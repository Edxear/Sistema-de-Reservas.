const mongoose = require('mongoose');

// Escalas clínicas de gravedad (SOFA, APACHE, RASS, CAM-ICU, MEWS, etc.)
const escalaClinicaSchema = new mongoose.Schema({
  episodioUCI: { type: mongoose.Schema.Types.ObjectId, ref: 'EpisodioUCI', required: true, index: true },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fechaEvaluacion: { type: Date, default: Date.now, index: true },

  tipoEscala: {
    type: String,
    enum: ['SOFA', 'APACHE_II', 'RASS', 'CAM_ICU', 'MEWS', 'GLASGOW', 'NORTON', 'BRADEN', 'EVA_DOLOR'],
    required: true,
    index: true,
  },

  puntaje: { type: Number, required: true },
  interpretacion: { type: String, default: '', maxlength: 200 }, // ej: "Disfunción orgánica moderada"
  items: { type: mongoose.Schema.Types.Mixed, default: {} }, // Desglose por ítem de la escala

  evaluadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notas: { type: String, default: '', maxlength: 300 },
}, { timestamps: true });

escalaClinicaSchema.index({ episodioUCI: 1, tipoEscala: 1, fechaEvaluacion: -1 });

module.exports = mongoose.model('EscalaClinica', escalaClinicaSchema);
