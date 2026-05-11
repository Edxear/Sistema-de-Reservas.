const mongoose = require('mongoose');

const nursingHandoffSchema = new mongoose.Schema({
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
      'Oncologia / Cuidados Paliativos',
      'Cardiologia Critica',
      'Rehabilitacion / Kinesiologia',
    ],
    required: true,
  },
  fechaTurno: { type: Date, required: true, index: true },
  turnoSaliente: { type: String, enum: ['manana', 'tarde', 'noche'], required: true },
  turnoEntrante: { type: String, enum: ['manana', 'tarde', 'noche'], required: true },
  estado: { type: String, enum: ['draft', 'sent', 'received'], default: 'draft' },
  pacientesInestables: { type: [String], default: [] },
  medicacionAdministrada: { type: String, default: '', trim: true, maxlength: 4000 },
  pendientesCriticos: { type: [String], default: [] },
  incidencias: { type: [String], default: [] },
  resumenTurno: { type: String, default: '', trim: true, maxlength: 6000 },
  audioNoteUrl: { type: String, default: '', trim: true, maxlength: 800 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt: { type: Date },
  receivedAt: { type: Date },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

nursingHandoffSchema.index({ rama: 1, fechaTurno: -1, estado: 1 });
nursingHandoffSchema.index({ turnoEntrante: 1, estado: 1, fechaTurno: -1 });

module.exports = mongoose.model('NursingHandoff', nursingHandoffSchema);
