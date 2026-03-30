const mongoose = require('mongoose');

const ordenMedicaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tipo: {
    type: String,
    enum: ['laboratorio', 'imagen', 'interconsulta', 'procedimiento'],
    required: true,
    index: true,
  },
  prioridad: {
    type: String,
    enum: ['urgente', 'alta', 'media', 'baja'],
    default: 'media',
    index: true,
  },
  estado: {
    type: String,
    enum: ['solicitada', 'en_proceso', 'completada', 'cancelada'],
    default: 'solicitada',
    index: true,
  },
  indicacion: { type: String, required: true, maxlength: 800 },
  diagnostico: { type: String, default: '', maxlength: 300 },
  fechaOrden: { type: Date, default: Date.now },
  fechaObjetivo: { type: Date },
  resultadoResumen: { type: String, default: '', maxlength: 1200 },
  metadata: {
    origen: { type: String, default: 'modulo_ordenes' },
    referencia: { type: String, default: '' },
  },
}, { timestamps: true });

ordenMedicaSchema.index({ paciente: 1, fechaOrden: -1 });
ordenMedicaSchema.index({ medico: 1, fechaOrden: -1 });

module.exports = mongoose.model('OrdenMedica', ordenMedicaSchema);
