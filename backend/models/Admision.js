const mongoose = require('mongoose');

// Episodio de admisión hospitalaria (consulta, internación, urgencia)
const admisionSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tipoAdmision: {
    type: String,
    enum: ['consulta', 'internacion', 'urgencia', 'cirugia', 'hospital_dia'],
    required: true,
    index: true,
  },
  servicio: { type: String, required: true, maxlength: 100 },
  medicoTratante: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  fechaIngreso: { type: Date, default: Date.now, index: true },
  fechaAlta: { type: Date },

  estado: {
    type: String,
    enum: ['activa', 'alta', 'traslado', 'fallecimiento', 'cancelada'],
    default: 'activa',
    index: true,
  },

  motivoIngreso: { type: String, default: '', maxlength: 500 },
  diagnosticoIngreso: { type: String, default: '', maxlength: 300 },
  diagnosticoEgreso: { type: String, default: '', maxlength: 300 },

  // Cobertura de seguro validada al ingreso
  cobertura: {
    seguro: { type: String, default: '' },
    numeroAfiliado: { type: String, default: '' },
    planCobertura: { type: String, default: '' },
    validada: { type: Boolean, default: false },
    fechaValidacion: { type: Date },
  },

  // Cama asignada
  cama: { type: mongoose.Schema.Types.ObjectId, ref: 'BedUnit', default: null },

  // Contacto de emergencia
  contactoEmergencia: {
    nombre: { type: String, default: '' },
    relacion: { type: String, default: '' },
    telefono: { type: String, default: '' },
  },

  // Documentación
  documentos: [{
    tipo: { type: String, enum: ['consentimiento', 'triaje', 'admision', 'alta', 'otro'], default: 'otro' },
    nombre: { type: String, default: '' },
    url: { type: String, default: '' },
    firmado: { type: Boolean, default: false },
    fechaFirma: { type: Date },
    firmaBase64: { type: String, default: '' },
  }],

  // Pulsera de identificación
  pulsera: {
    generada: { type: Boolean, default: false },
    codigoQr: { type: String, default: '' },
    fechaImpresion: { type: Date },
  },

  // Triaje / signos vitales al ingreso
  triaje: {
    temperatura: { type: String, default: '' },
    presionArterial: { type: String, default: '' },
    frecuenciaCardiaca: { type: String, default: '' },
    saturacionO2: { type: String, default: '' },
    peso: { type: String, default: '' },
    talla: { type: String, default: '' },
    glasgow: { type: Number },
    prioridad: { type: String, enum: ['I', 'II', 'III', 'IV', 'V'], default: 'III' },
  },

  registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  observaciones: { type: String, default: '', maxlength: 500 },
}, { timestamps: true });

admisionSchema.index({ paciente: 1, fechaIngreso: -1 });
admisionSchema.index({ estado: 1, tipoAdmision: 1 });
admisionSchema.index({ servicio: 1, estado: 1 });

module.exports = mongoose.model('Admision', admisionSchema);
