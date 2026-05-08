const mongoose = require('mongoose');

// Resultado de cada práctica dentro de una solicitud de laboratorio
const resultadoLabSchema = new mongoose.Schema({
  solicitud: { type: mongoose.Schema.Types.ObjectId, ref: 'SolicitudLab', required: true, index: true },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  practica: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticaLab', required: true, index: true },

  // Valor numérico o textual
  valorNumerico: { type: Number },
  valorTexto: { type: String, default: '', maxlength: 300 },
  unidad: { type: String, default: '', maxlength: 30 },

  // Interpretación automática
  interpretacion: {
    type: String,
    enum: ['normal', 'bajo', 'alto', 'critico_bajo', 'critico_alto', 'pendiente'],
    default: 'pendiente',
    index: true,
  },
  esCritico: { type: Boolean, default: false, index: true },
  alertaEnviada: { type: Boolean, default: false },

  fechaResultado: { type: Date, default: Date.now, index: true },
  tecnico: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Firma del bioquímico responsable
  firma: {
    firmado: { type: Boolean, default: false },
    bioquimico: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaFirma: { type: Date },
  },

  // Modificaciones posteriores (trazabilidad)
  modificaciones: [{
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    valorAnterior: String,
    motivo: { type: String, maxlength: 200 },
  }],

  observaciones: { type: String, default: '', maxlength: 500 },
}, { timestamps: true });

resultadoLabSchema.index({ solicitud: 1, practica: 1 });
resultadoLabSchema.index({ paciente: 1, fechaResultado: -1 });
resultadoLabSchema.index({ esCritico: 1, alertaEnviada: 1 });

module.exports = mongoose.model('ResultadoLab', resultadoLabSchema);
