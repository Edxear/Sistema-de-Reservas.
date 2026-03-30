const mongoose = require('mongoose');

const historiaClinicaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fecha: { type: Date, default: Date.now },
  tipo: { type: String, enum: ['evolucion', 'receta', 'estudio', 'certificado'], default: 'evolucion' },
  eventCategory: {
    type: String,
    enum: ['consulta', 'procedimiento', 'receta', 'estudio', 'administrativo', 'evolucion'],
    default: 'evolucion',
    index: true,
  },
  descripcion: { type: String, required: true },
  clinicalSnapshot: {
    motivoConsulta: { type: String, default: '' },
    diagnostico: { type: String, default: '' },
    plan: { type: String, default: '' },
    alergiasRelevantes: [{ type: String }],
    signosVitales: {
      ta: { type: String, default: '' },
      fc: { type: String, default: '' },
      fr: { type: String, default: '' },
      temp: { type: String, default: '' },
      satO2: { type: String, default: '' },
      peso: { type: String, default: '' },
      talla: { type: String, default: '' },
      imc: { type: String, default: '' },
    },
  },
  flags: {
    esCritico: { type: Boolean, default: false },
    requiereSeguimiento: { type: Boolean, default: false },
  },
  metadata: {
    sourceModule: { type: String, default: '' },
    referenceId: { type: String, default: '' },
  },
  archivosAdjuntos: [{ nombre: String, url: String }],
}, { timestamps: true });

historiaClinicaSchema.index({ paciente: 1, fecha: -1, tipo: 1 });
historiaClinicaSchema.index({ paciente: 1, eventCategory: 1, fecha: -1 });

module.exports = mongoose.model('HistoriaClinica', historiaClinicaSchema);
