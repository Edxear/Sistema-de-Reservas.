/**
 * Phase 3 – Area Operacional Models
 * Provides Incidente and ChecklistTurno documents for each hospital area.
 * Areas: 'guardia', 'salud-mental', 'mantenimiento', 'paramedicos', 'enfermeria', 'general'
 */

const mongoose = require('mongoose');

// ── Incidente ────────────────────────────────────────────────────────────────
const incidenteSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: true,
      index: true,
      enum: ['guardia', 'salud-mental', 'mantenimiento', 'paramedicos', 'enfermeria', 'general'],
    },
    tipo: {
      type: String,
      required: true,
      enum: ['critico', 'medio', 'leve', 'informativo'],
      default: 'medio',
    },
    titulo: { type: String, required: true, maxlength: 200, trim: true },
    descripcion: { type: String, maxlength: 1000, default: '' },
    estado: {
      type: String,
      enum: ['abierto', 'en-proceso', 'cerrado'],
      default: 'abierto',
      index: true,
    },
    accion: { type: String, maxlength: 600, default: '' },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cerradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fechaCierre: { type: Date, default: null },
  },
  { timestamps: true }
);

incidenteSchema.index({ area: 1, estado: 1, createdAt: -1 });

// ── ChecklistTurno ────────────────────────────────────────────────────────────
const checklistItemSchema = new mongoose.Schema(
  {
    descripcion: { type: String, required: true, maxlength: 300 },
    completado: { type: Boolean, default: false },
    completadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    nota: { type: String, maxlength: 300, default: '' },
    completadoAt: { type: Date, default: null },
  },
  { _id: false }
);

const checklistTurnoSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: true,
      index: true,
      enum: ['guardia', 'salud-mental', 'mantenimiento', 'paramedicos', 'enfermeria', 'general'],
    },
    turno: {
      type: String,
      required: true,
      enum: ['manana', 'tarde', 'noche'],
    },
    fecha: { type: Date, required: true, index: true },
    items: { type: [checklistItemSchema], default: [] },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cerradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cerrado: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Unique constraint: one checklist per area per turno per day
checklistTurnoSchema.index(
  { area: 1, turno: 1, fecha: 1 },
  { unique: true }
);

const Incidente = mongoose.model('AreaIncidente', incidenteSchema);
const ChecklistTurno = mongoose.model('AreaChecklist', checklistTurnoSchema);

module.exports = { Incidente, ChecklistTurno };
