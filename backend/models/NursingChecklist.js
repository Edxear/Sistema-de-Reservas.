const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  done: { type: Boolean, default: false },
}, { _id: false });

const nursingChecklistSchema = new mongoose.Schema({
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
  turno: { type: String, enum: ['manana', 'tarde', 'noche'], required: true },
  fecha: { type: Date, required: true },
  pacientesAtendidos: { type: Number, default: 0, min: 0 },
  dotacionPlanificada: { type: Number, default: 0, min: 0 },
  dotacionPresente: { type: Number, default: 0, min: 0 },
  alertasCriticas: { type: Number, default: 0, min: 0 },
  cumplimientoProtocolos: { type: Number, default: 0, min: 0, max: 100 },
  adherenciaCapacitacion: { type: Number, default: 0, min: 0, max: 100 },
  items: { type: [checklistItemSchema], default: [] },
  observaciones: { type: String, default: '', maxlength: 2000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

nursingChecklistSchema.index({ rama: 1, fecha: -1, turno: 1 });

module.exports = mongoose.model('NursingChecklist', nursingChecklistSchema);
