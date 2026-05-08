const mongoose = require('mongoose');

// Balance hídrico horario del paciente UCI
const balanceHidricoSchema = new mongoose.Schema({
  episodioUCI: { type: mongoose.Schema.Types.ObjectId, ref: 'EpisodioUCI', required: true, index: true },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fechaHora: { type: Date, default: Date.now, index: true },

  tipoRegistro: {
    type: String,
    enum: ['ingreso', 'egreso'],
    required: true,
  },

  // Ingresos (IV, oral, SNG, etc.)
  tipoLiquido: {
    type: String,
    enum: ['sf09', 'dext5', 'ringer', 'sangre', 'plasma', 'albumina', 'np_total', 'oral', 'sng', 'orina', 'drenaje', 'perdida_insensible', 'otro'],
    default: 'sf09',
  },

  volumenMl: { type: Number, required: true, min: 0 },
  via: { type: String, default: '', maxlength: 60 },

  registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notas: { type: String, default: '', maxlength: 200 },
}, { timestamps: true });

balanceHidricoSchema.index({ episodioUCI: 1, fechaHora: -1 });

module.exports = mongoose.model('BalanceHidrico', balanceHidricoSchema);
