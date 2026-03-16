const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'El nombre del servicio es obligatorio'], unique: true },
  descripcion: String,
  duracion: { type: Number, required: true, min: 15 },
  precio: { type: Number, required: true, min: 0 },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
