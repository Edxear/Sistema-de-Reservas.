const mongoose = require('mongoose');

const nursingWoundPhotoSchema = new mongoose.Schema({
  rama: { type: String, required: true, trim: true },
  pacienteRef: { type: String, default: '', trim: true },
  tipoHerida: { type: String, required: true, trim: true },
  zonaCorporal: { type: String, default: '', trim: true },
  estadio: { type: String, default: '', trim: true },
  observaciones: { type: String, default: '', maxlength: 2000, trim: true },
  imageDataUrl: { type: String, required: true, maxlength: 3500000 },
  tomadaEn: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

nursingWoundPhotoSchema.index({ rama: 1, tomadaEn: -1 });
nursingWoundPhotoSchema.index({ pacienteRef: 1, tomadaEn: -1 });

module.exports = mongoose.model('NursingWoundPhoto', nursingWoundPhotoSchema);
