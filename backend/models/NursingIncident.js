const mongoose = require('mongoose');

const nursingIncidentSchema = new mongoose.Schema({
  rama: {
    type: String,
    enum: [
      'Guardia',
      'Internacion Adultos',
      'UTI / Cuidados Criticos',
      'Quirurgica',
      'Pediatrica',
      'Neonatologia',
      'Salud Mental',
      'Vacunatorio',
      'Control de Infecciones',
    ],
    required: true,
  },
  tipo: { type: String, enum: ['medicacion', 'caidas', 'infecciones', 'comunicacion', 'otros'], required: true },
  severidad: { type: String, enum: ['baja', 'media', 'alta', 'critica'], default: 'media' },
  estado: { type: String, enum: ['abierto', 'en_investigacion', 'cerrado'], default: 'abierto' },
  descripcion: { type: String, required: true, maxlength: 2500 },
  pacienteRef: { type: String, default: '', maxlength: 180 },
  acciones: { type: String, default: '', maxlength: 2000 },
  firstActionAt: { type: Date },
  closedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

nursingIncidentSchema.index({ rama: 1, estado: 1, severidad: 1, createdAt: -1 });

module.exports = mongoose.model('NursingIncident', nursingIncidentSchema);
