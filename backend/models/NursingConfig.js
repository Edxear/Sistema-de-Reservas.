const mongoose = require('mongoose');

const nursingConfigSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, default: 'default' },
  thresholds: {
    eventosPor1000: {
      greenMax: { type: Number, default: 5 },
      yellowMax: { type: Number, default: 10 },
    },
    respuestaMin: {
      greenMax: { type: Number, default: 15 },
      yellowMax: { type: Number, default: 45 },
    },
    cumplimientoChecklistPct: {
      yellowMin: { type: Number, default: 85 },
      greenMin: { type: Number, default: 95 },
    },
    ausentismoPct: {
      greenMax: { type: Number, default: 5 },
      yellowMax: { type: Number, default: 10 },
    },
    adherenciaCapacitacionPct: {
      yellowMin: { type: Number, default: 80 },
      greenMin: { type: Number, default: 92 },
    },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('NursingConfig', nursingConfigSchema);
