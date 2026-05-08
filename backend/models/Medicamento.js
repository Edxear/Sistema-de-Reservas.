const mongoose = require('mongoose');

// Catálogo de medicamentos del hospital
const medicamentoSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, maxlength: 40 },
  nombreComercial: { type: String, default: '', maxlength: 200 },
  principioActivo: { type: String, required: true, maxlength: 200 },
  concentracion: { type: String, default: '', maxlength: 80 },  // ej: "500mg", "10mg/ml"
  formaFarmaceutica: {
    type: String,
    enum: ['comprimido', 'capsula', 'jarabe', 'ampolla', 'solucion_iv', 'crema', 'parche', 'inhalador', 'gotas', 'supositorio', 'otro'],
    default: 'comprimido',
    index: true,
  },
  via: {
    type: String,
    enum: ['oral', 'iv', 'im', 'sc', 'topica', 'inhalatoria', 'sublingual', 'rectal', 'otra'],
    default: 'oral',
  },
  laboratorio: { type: String, default: '', maxlength: 100 },
  grupoTerapeutico: { type: String, default: '', maxlength: 100 },
  requiereReceta: { type: Boolean, default: true },
  requiereControlEspecial: { type: Boolean, default: false }, // psicotrópicos, estupefacientes
  activo: { type: Boolean, default: true, index: true },
  alertasAlergias: [{ type: String }], // sustancias relacionadas con alergias cruzadas
}, { timestamps: true });

medicamentoSchema.index({ principioActivo: 1, activo: 1 });

module.exports = mongoose.model('Medicamento', medicamentoSchema);
