const mongoose = require('mongoose');

// Nota SOAP estructurada por especialidad
const soapSchema = new mongoose.Schema({
  subjetivo: { type: String, default: '' },   // Lo que refiere el paciente
  objetivo: { type: String, default: '' },    // Hallazgos del examen físico
  analisis: { type: String, default: '' },    // Diagnósticos / impresión clínica (CIE-11)
  plan: { type: String, default: '' },        // Plan terapéutico
  codigoCie: { type: String, default: '' },   // Código CIE-11 / SNOMED principal
  especialidad: { type: String, default: '' },
}, { _id: false });

const historiaClinicaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fecha: { type: Date, default: Date.now },
  tipo: { type: String, enum: ['evolucion', 'receta', 'estudio', 'certificado', 'interconsulta', 'ingreso', 'egreso'], default: 'evolucion' },
  eventCategory: {
    type: String,
    enum: ['consulta', 'procedimiento', 'receta', 'estudio', 'administrativo', 'evolucion', 'interconsulta', 'ingreso', 'egreso'],
    default: 'evolucion',
    index: true,
  },
  descripcion: { type: String, required: true },

  // Nota SOAP completa
  soap: { type: soapSchema, default: () => ({}) },

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

  // Episodio clínico al que pertenece (consulta, internación, urgencias)
  episodioTipo: {
    type: String,
    enum: ['consulta', 'internacion', 'urgencias', 'telemedicina'],
    default: 'consulta',
  },

  // Firma digital del médico (timestamp + hash del contenido)
  firmaDigital: {
    firmado: { type: Boolean, default: false },
    fechaFirma: { type: Date },
    hash: { type: String, default: '' },
    firmadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },

  flags: {
    esCritico: { type: Boolean, default: false },
    requiereSeguimiento: { type: Boolean, default: false },
    esPrivado: { type: Boolean, default: false },   // Solo visible para el médico tratante
  },
  metadata: {
    sourceModule: { type: String, default: '' },
    referenceId: { type: String, default: '' },
    version: { type: Number, default: 1 },          // Control de versiones
  },
  archivosAdjuntos: [{
    nombre: String,
    url: String,
    tipo: { type: String, enum: ['imagen', 'pdf', 'video', 'otro'], default: 'otro' },
    hash: { type: String, default: '' },             // Integridad del archivo
    fechaSubida: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

historiaClinicaSchema.index({ paciente: 1, fecha: -1, tipo: 1 });
historiaClinicaSchema.index({ paciente: 1, eventCategory: 1, fecha: -1 });
historiaClinicaSchema.index({ 'firmaDigital.firmado': 1 });

module.exports = mongoose.model('HistoriaClinica', historiaClinicaSchema);
