const mongoose = require('mongoose');

// Alergias e intolerancias del paciente
const alergiaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sustancia: { type: String, required: true, maxlength: 200 },
  tipo: {
    type: String,
    enum: ['medicamentosa', 'alimentaria', 'ambiental', 'otra'],
    default: 'medicamentosa',
    index: true,
  },
  reaccion: { type: String, default: '', maxlength: 300 },
  gravedad: {
    type: String,
    enum: ['leve', 'moderada', 'grave', 'anafilaxia'],
    default: 'leve',
    index: true,
  },
  estado: {
    type: String,
    enum: ['activa', 'inactiva'],
    default: 'activa',
  },
  fechaRegistro: { type: Date, default: Date.now },
  notas: { type: String, default: '', maxlength: 400 },
}, { timestamps: true });

alergiaSchema.index({ paciente: 1, tipo: 1, gravedad: 1 });

module.exports = mongoose.model('Alergia', alergiaSchema);
