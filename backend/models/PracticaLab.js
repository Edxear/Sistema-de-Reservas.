const mongoose = require('mongoose');

// Catálogo de prácticas de laboratorio
const practicaLabSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, maxlength: 30 },
  nombre: { type: String, required: true, maxlength: 200 },
  unidadMedida: { type: String, default: '', maxlength: 30 },
  rangoNormalMin: { type: Number },
  rangoNormalMax: { type: Number },
  rangoNormalTexto: { type: String, default: '', maxlength: 100 }, // para valores cualitativos
  valorCriticoMin: { type: Number },
  valorCriticoMax: { type: Number },
  metodologia: { type: String, default: '', maxlength: 200 },
  tipoMuestra: { type: String, default: 'sangre', maxlength: 80 }, // sangre, orina, heces, etc.
  tipoTubo: { type: String, default: '', maxlength: 60 },
  tiempoEntrega: { type: Number, default: 24 },  // horas
  costo: { type: Number, default: 0 },
  activo: { type: Boolean, default: true, index: true },
  categoria: {
    type: String,
    enum: ['hematologia', 'bioquimica', 'coagulacion', 'microbiologia', 'inmunologia', 'hormonas', 'orina', 'otro'],
    default: 'bioquimica',
    index: true,
  },
}, { timestamps: true });

practicaLabSchema.index({ codigo: 1 });
practicaLabSchema.index({ categoria: 1, activo: 1 });

module.exports = mongoose.model('PracticaLab', practicaLabSchema);
