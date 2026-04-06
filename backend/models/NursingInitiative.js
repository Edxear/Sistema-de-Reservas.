const mongoose = require('mongoose');

const nursingInitiativeSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true, maxlength: 180 },
  descripcion: { type: String, default: '', maxlength: 2000 },
  categoria: {
    type: String,
    enum: ['transversal', 'rama', 'organigrama', 'digitalizacion', 'kpi'],
    required: true,
  },
  rama: {
    type: String,
    enum: [
      'general',
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
    default: 'general',
  },
  prioridad: { type: String, enum: ['baja', 'media', 'alta', 'critica'], default: 'media' },
  estado: { type: String, enum: ['pendiente', 'en_progreso', 'implementado'], default: 'pendiente' },
  responsable: { type: String, default: '', trim: true, maxlength: 120 },
  fechaObjetivo: { type: Date },
  activo: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

nursingInitiativeSchema.index({ categoria: 1, rama: 1, estado: 1, prioridad: 1 });

module.exports = mongoose.model('NursingInitiative', nursingInitiativeSchema);
