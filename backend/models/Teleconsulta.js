const mongoose = require('mongoose');

const teleconsultaSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fechaProgramada: { type: Date, required: true, index: true },
  enlaceSala: { type: String, required: true, trim: true },
  estado: {
    type: String,
    enum: ['programada', 'en_curso', 'finalizada', 'cancelada'],
    default: 'programada',
    index: true,
  },
  notas: { type: String, default: '', maxlength: 800 },

  // Tiempos de sesión
  fechaInicio: { type: Date },
  fechaFin: { type: Date },
  duracionMinutos: { type: Number, default: 0 },

  // Consentimiento informado digital
  consentimiento: {
    aceptado: { type: Boolean, default: false },
    fechaAceptacion: { type: Date },
    ipPaciente: { type: String, default: '' },
    textoVersion: { type: String, default: 'v1' },
  },

  // Grabación de la sesión (opcional, con aviso al paciente)
  grabacion: {
    habilitada: { type: Boolean, default: false },
    url: { type: String, default: '' },
    duracionSegundos: { type: Number, default: 0 },
    hash: { type: String, default: '' },
  },

  // Documentos adjuntos enviados por el paciente antes de la consulta
  documentosPrevios: [{
    nombre: String,
    url: String,
    tipo: { type: String, default: 'otro' },
    subidoPor: { type: String, enum: ['paciente', 'medico'], default: 'paciente' },
  }],

  // Receta digital generada en la teleconsulta
  receta: { type: mongoose.Schema.Types.ObjectId, ref: 'Receta', default: null },

  // Encuesta de satisfacción post-consulta
  encuesta: {
    respondida: { type: Boolean, default: false },
    puntuacion: { type: Number, min: 1, max: 5 },
    comentario: { type: String, default: '', maxlength: 500 },
    fechaRespuesta: { type: Date },
  },

  // Indicadores técnicos de la llamada
  calidadLlamada: {
    problemasTecnicos: { type: Boolean, default: false },
    descripcion: { type: String, default: '', maxlength: 200 },
  },
}, { timestamps: true });

teleconsultaSchema.index({ paciente: 1, fechaProgramada: -1 });
teleconsultaSchema.index({ medico: 1, fechaProgramada: -1 });
teleconsultaSchema.index({ estado: 1, fechaProgramada: -1 });

module.exports = mongoose.model('Teleconsulta', teleconsultaSchema);
