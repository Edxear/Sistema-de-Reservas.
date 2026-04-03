const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema({
  fromLevel: { type: String, enum: ['L1', 'L2', 'L3'] },
  toLevel: { type: String, enum: ['L1', 'L2', 'L3'], required: true },
  motivo: { type: String, required: true, maxlength: 300 },
  fecha: { type: Date, default: Date.now },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const supportTicketSchema = new mongoose.Schema({
  codigo: { type: String, unique: true },
  titulo: { type: String, required: true, trim: true, maxlength: 140 },
  descripcion: { type: String, required: true, trim: true, maxlength: 4000 },
  tipoGestion: {
    type: String,
    enum: ['incidente', 'cambio', 'problema', 'seguridad', 'backup', 'capacitacion', 'continuidad', 'identidad', 'obra_social'],
    default: 'incidente',
  },
  criticidad: { type: String, enum: ['critico', 'alto', 'medio', 'bajo'], default: 'medio' },
  estado: { type: String, enum: ['abierto', 'en_progreso', 'en_espera', 'resuelto', 'cerrado'], default: 'abierto' },
  soporteNivel: { type: String, enum: ['L1', 'L2', 'L3'], default: 'L1' },
  areaClinica: { type: String, default: '' },
  modulo: { type: String, default: '' },
  impactoClinico: { type: String, default: '' },
  solicitante: {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nombre: { type: String, default: '' },
    rol: { type: String, default: '' },
    area: { type: String, default: '' },
  },
  asignadoA: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  coordinador: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slaRespuestaMin: { type: Number, default: 120 },
  slaResolucionMin: { type: Number, default: 1440 },
  responseDueAt: { type: Date },
  resolutionDueAt: { type: Date },
  firstResponseAt: { type: Date },
  resolvedAt: { type: Date },
  rootCause: { type: String, default: '' },
  workaround: { type: String, default: '' },
  resolutionNotes: { type: String, default: '' },
  changeValidationStatus: {
    type: String,
    enum: ['no_aplica', 'pendiente', 'en_testing', 'aprobado', 'rechazado', 'desplegado'],
    default: 'no_aplica',
  },
  requiresChangeValidation: { type: Boolean, default: false },
  escalationHistory: { type: [escalationSchema], default: [] },
  surveyScore: { type: Number, min: 1, max: 5 },
  surveyComment: { type: String, default: '' },
  routingReason: { type: String, default: '' },
  kbArticleRef: { type: String, default: '' },
  autoRouting: {
    recommendedLevel: { type: String, enum: ['L1', 'L2', 'L3'], default: 'L1' },
    confidence: { type: Number, default: 0.5, min: 0, max: 1 },
    routedAt: { type: Date },
  },
  tags: { type: [String], default: [] },
}, { timestamps: true });

supportTicketSchema.pre('save', function preSave(next) {
  if (!this.codigo) {
    const rand = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const year = new Date().getFullYear();
    this.codigo = `TCK-${year}-${rand}`;
  }
  next();
});

supportTicketSchema.index({ criticidad: 1, estado: 1, soporteNivel: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
