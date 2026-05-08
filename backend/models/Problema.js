const mongoose = require('mongoose');

// Lista de problemas clínicos activos/inactivos del paciente (codificados CIE-11)
const problemaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  codigoCie: { type: String, default: '', maxlength: 20 },
  descripcion: { type: String, required: true, maxlength: 400 },
  tipoProblema: {
    type: String,
    enum: ['cronico', 'agudo', 'quirurgico', 'familiar', 'habito', 'alergico'],
    default: 'cronico',
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'resuelto'],
    default: 'activo',
    index: true,
  },
  fechaInicio: { type: Date, default: Date.now },
  fechaResolucion: { type: Date },
  notas: { type: String, default: '', maxlength: 600 },
}, { timestamps: true });

problemaSchema.index({ paciente: 1, estado: 1, fechaInicio: -1 });

module.exports = mongoose.model('Problema', problemaSchema);
