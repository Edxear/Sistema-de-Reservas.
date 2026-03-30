const mongoose = require('mongoose');

const bedUnitSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, trim: true },
  sector: { type: String, required: true, trim: true, index: true },
  estado: {
    type: String,
    enum: ['libre', 'ocupada', 'limpieza', 'mantenimiento', 'reservada', 'aislamiento'],
    default: 'libre',
    index: true,
  },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  observaciones: { type: String, default: '', maxlength: 400 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

bedUnitSchema.index({ sector: 1, estado: 1 });
bedUnitSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('BedUnit', bedUnitSchema);
