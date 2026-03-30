const mongoose = require('mongoose');

const teleconsultaSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fechaProgramada: { type: Date, required: true, index: true },
  enlaceSala: { type: String, required: true, trim: true },
  estado: {
    type: String,
    enum: ['programada', 'en_curso', 'finalizada', 'cancelada'],
    default: 'programada',
    index: true,
  },
  notas: { type: String, default: '', maxlength: 800 },
}, { timestamps: true });

teleconsultaSchema.index({ paciente: 1, fechaProgramada: -1 });
teleconsultaSchema.index({ medico: 1, fechaProgramada: -1 });

module.exports = mongoose.model('Teleconsulta', teleconsultaSchema);
