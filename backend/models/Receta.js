const mongoose = require('mongoose');

const recetaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fechaEmision: { type: Date, default: Date.now },
  medicamentos: [
    {
      nombre: { type: String, required: true },
      dosis: String,
      presentacion: String,
      indicaciones: String
    }
  ],
  esFavorita: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Receta', recetaSchema);
