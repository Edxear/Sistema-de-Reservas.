const mongoose = require('mongoose');

const historiaClinicaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fecha: { type: Date, default: Date.now },
  tipo: { type: String, enum: ['evolucion', 'receta', 'estudio', 'certificado'], default: 'evolucion' },
  descripcion: { type: String, required: true },
  archivosAdjuntos: [{ nombre: String, url: String }]
}, { timestamps: true });

module.exports = mongoose.model('HistoriaClinica', historiaClinicaSchema);
