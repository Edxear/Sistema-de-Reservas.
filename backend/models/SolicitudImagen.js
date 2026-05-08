const mongoose = require('mongoose');

// Solicitud + turno + resultado de estudio de imagen (todo en un documento)
const solicitudImagenSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ordenMedica: { type: mongoose.Schema.Types.ObjectId, ref: 'OrdenMedica', default: null },
  estudio: { type: mongoose.Schema.Types.ObjectId, ref: 'EstudioImagen', required: true },

  areaAnatomica: { type: String, default: '', maxlength: 100 },
  motivoSolicitud: { type: String, default: '', maxlength: 500 },
  restricciones: { type: String, default: '', maxlength: 300 }, // ej: claustrofobia, marcapasos
  diagnosticoPresuntivo: { type: String, default: '', maxlength: 300 },

  prioridad: {
    type: String,
    enum: ['urgente', 'alta', 'media', 'baja'],
    default: 'media',
    index: true,
  },

  // Estado del flujo
  estado: {
    type: String,
    enum: ['solicitada', 'agendada', 'en_proceso', 'realizada', 'informada', 'cancelada'],
    default: 'solicitada',
    index: true,
  },

  fechaSolicitud: { type: Date, default: Date.now, index: true },

  // Turno asignado
  turno: {
    fechaHora: { type: Date },
    equipo: { type: String, default: '', maxlength: 100 },
    sala: { type: String, default: '', maxlength: 60 },
    tecnicoAsignado: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },

  // Resultado / estudio realizado
  resultado: {
    fechaRealizacion: { type: Date },
    tecnicoRealizo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    urlDicom: { type: String, default: '' },       // URL a PACS o visor
    urlImagenPreview: { type: String, default: '' },
    informe: { type: String, default: '', maxlength: 3000 },
    hallazgos: { type: String, default: '', maxlength: 2000 },
    impresionDiagnostica: { type: String, default: '', maxlength: 500 },
    firma: {
      firmado: { type: Boolean, default: false },
      radiologo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fechaFirma: { type: Date },
    },
  },

  // Control de dosis (radioprotección)
  dosisRadiacion: {
    dlp: { type: Number },      // Dose-Length Product (mGy·cm)
    ctdiVol: { type: Number },  // CTDI volumétrico
    registrado: { type: Boolean, default: false },
  },

  observaciones: { type: String, default: '', maxlength: 500 },
}, { timestamps: true });

solicitudImagenSchema.index({ paciente: 1, fechaSolicitud: -1 });
solicitudImagenSchema.index({ estado: 1, prioridad: 1 });
solicitudImagenSchema.index({ 'turno.fechaHora': 1 });

module.exports = mongoose.model('SolicitudImagen', solicitudImagenSchema);
