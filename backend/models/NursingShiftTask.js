const mongoose = require('mongoose');

const nursingShiftTaskSchema = new mongoose.Schema({
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
  turno: { type: String, enum: ['manana', 'tarde', 'noche'], required: true },
  fechaTurno: { type: Date, required: true, index: true },
  pacienteRef: { type: String, default: '', trim: true, maxlength: 180 },
  tipo: {
    type: String,
    enum: ['medicacion', 'cura', 'constantes', 'procedimiento', 'traslado', 'evaluacion', 'administrativa', 'otro'],
    default: 'otro',
  },
  titulo: { type: String, required: true, trim: true, maxlength: 220 },
  descripcion: { type: String, default: '', trim: true, maxlength: 2000 },
  prioridad: { type: String, enum: ['baja', 'media', 'alta', 'critica'], default: 'media' },
  estado: { type: String, enum: ['pendiente', 'en_progreso', 'hecho', 'aplazado', 'no_aplica'], default: 'pendiente' },
  horaSugerida: { type: String, default: '', trim: true, maxlength: 5 },
  origen: { type: String, enum: ['manual', 'auto'], default: 'manual' },
  sourceRef: {
    kind: { type: String, default: '', trim: true, maxlength: 80 },
    id: { type: String, default: '', trim: true, maxlength: 120 },
  },
  aplazadaHasta: { type: Date },
  completedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  asignadoA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

nursingShiftTaskSchema.index({ rama: 1, fechaTurno: -1, turno: 1, estado: 1 });
nursingShiftTaskSchema.index({ createdBy: 1, fechaTurno: -1 });

module.exports = mongoose.model('NursingShiftTask', nursingShiftTaskSchema);
