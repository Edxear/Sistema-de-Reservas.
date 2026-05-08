const mongoose = require('mongoose');

// Base de datos de interacciones medicamentosas
const interaccionMedicamentoSchema = new mongoose.Schema({
  medicamentoA: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicamento', required: true },
  medicamentoB: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicamento', required: true },
  nivelRiesgo: {
    type: String,
    enum: ['bajo', 'moderado', 'alto', 'contraindicado'],
    required: true,
    index: true,
  },
  mecanismo: { type: String, default: '', maxlength: 400 },
  descripcion: { type: String, required: true, maxlength: 600 },
  manejo: { type: String, default: '', maxlength: 400 }, // qué hacer ante la interacción
  activo: { type: Boolean, default: true },
}, { timestamps: true });

interaccionMedicamentoSchema.index({ medicamentoA: 1, medicamentoB: 1 }, { unique: true });
interaccionMedicamentoSchema.index({ nivelRiesgo: 1, activo: 1 });

module.exports = mongoose.model('InteraccionMedicamento', interaccionMedicamentoSchema);
