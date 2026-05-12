const mongoose = require('mongoose');

const nutricionSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dieta: {
    type: String,
    required: true,
  },
  fechaInicio: {
    type: Date,
    required: true,
  },
  fechaFin: {
    type: Date,
    default: null,
  },
  estado: {
    type: String,
    enum: ['activa', 'suspendida', 'finalizada'],
    default: 'activa',
  },
}, { timestamps: true });

module.exports = mongoose.model('Nutricion', nutricionSchema);
