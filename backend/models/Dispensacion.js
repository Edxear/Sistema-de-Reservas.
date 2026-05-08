const mongoose = require('mongoose');

// Dispensación de medicamentos (entrega al paciente o enfermería)
const dispensacionSchema = new mongoose.Schema({
  receta: { type: mongoose.Schema.Types.ObjectId, ref: 'Receta', required: true, index: true },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medicamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicamento', required: true },
  lote: { type: mongoose.Schema.Types.ObjectId, ref: 'LoteMedicamento', required: true },

  cantidadDispensada: { type: Number, required: true, min: 1 },
  dosis: { type: String, default: '', maxlength: 100 },
  frecuencia: { type: String, default: '', maxlength: 100 },
  duracionDias: { type: Number, default: 0 },

  fechaDispensacion: { type: Date, default: Date.now, index: true },

  farmaceutico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  entregadoA: {
    tipo: { type: String, enum: ['paciente', 'familiar', 'enfermeria', 'otro'], default: 'paciente' },
    nombre: { type: String, default: '', maxlength: 100 },
    firmaRecibo: { type: String, default: '' }, // base64 de firma digital
  },

  // Validaciones realizadas previo a la dispensación
  validaciones: {
    sinAlergias: { type: Boolean, default: false },
    sinInteracciones: { type: Boolean, default: false },
    sinDuplicidad: { type: Boolean, default: false },
    validadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },

  observaciones: { type: String, default: '', maxlength: 400 },
}, { timestamps: true });

dispensacionSchema.index({ receta: 1 });
dispensacionSchema.index({ paciente: 1, fechaDispensacion: -1 });
dispensacionSchema.index({ lote: 1 });

module.exports = mongoose.model('Dispensacion', dispensacionSchema);
