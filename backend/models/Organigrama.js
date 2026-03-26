const mongoose = require('mongoose');

const organigramaSchema = new mongoose.Schema(
  {
    area: { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organigrama', default: null },
    jefe: { type: String, required: true, trim: true },
    subjefe: { type: String, default: '', trim: true },
    equipos: { type: [String], default: [] },
    puestos: {
      type: [
        {
          nombre: { type: String, required: true, trim: true },
          personas: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    orden: { type: Number, default: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

organigramaSchema.index({ parentId: 1, orden: 1 });
organigramaSchema.index({ activo: 1, orden: 1 });
organigramaSchema.index({ area: 1 });

module.exports = mongoose.model('Organigrama', organigramaSchema);
