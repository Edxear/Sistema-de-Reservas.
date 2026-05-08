const mongoose = require('mongoose');

// Constantes vitales del paciente UCI (registros frecuentes)
const constanteVitalSchema = new mongoose.Schema({
  episodioUCI: { type: mongoose.Schema.Types.ObjectId, ref: 'EpisodioUCI', required: true, index: true },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fechaHora: { type: Date, default: Date.now, index: true },

  // Parámetros hemodinámicos
  fc: { type: Number },            // Frecuencia cardíaca (lpm)
  pas: { type: Number },           // Presión arterial sistólica (mmHg)
  pad: { type: Number },           // Presión arterial diastólica (mmHg)
  pam: { type: Number },           // Presión arterial media (mmHg)
  spo2: { type: Number },          // Saturación O2 (%)
  fr: { type: Number },            // Frecuencia respiratoria (rpm)
  temperatura: { type: Number },   // °C

  // Parámetros ventilatorios (si aplica)
  fio2: { type: Number },          // Fracción inspirada de O2 (%)
  peep: { type: Number },          // Presión positiva al final de espiración
  volumenCorriente: { type: Number },

  // MEWS score calculado (0-14)
  mewsScore: { type: Number, min: 0, max: 14 },
  alertaMews: { type: Boolean, default: false },

  registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  origenDato: { type: String, enum: ['manual', 'monitor', 'integrado'], default: 'manual' },
  notas: { type: String, default: '', maxlength: 300 },
}, { timestamps: true });

constanteVitalSchema.index({ episodioUCI: 1, fechaHora: -1 });
constanteVitalSchema.index({ alertaMews: 1 });

module.exports = mongoose.model('ConstanteVital', constanteVitalSchema);
