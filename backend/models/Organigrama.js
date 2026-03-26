const mongoose = require('mongoose');

const organigramaSchema = new mongoose.Schema(
  {
    area: { type: String, required: true, trim: true },
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

module.exports = mongoose.model('Organigrama', organigramaSchema);
