const mongoose = require('mongoose');

// Catálogo de prestaciones facturables
const prestacionSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, maxlength: 30 },
  nombre: { type: String, required: true, maxlength: 200 },
  categoria: {
    type: String,
    enum: ['consulta', 'estudio', 'cirugia', 'internacion_dia', 'procedimiento', 'farmacia', 'emergencia', 'otro'],
    default: 'consulta',
    index: true,
  },
  arancelBase: { type: Number, required: true, min: 0 },
  unidad: { type: String, default: 'unidad', maxlength: 40 }, // unidad, dia, sesion
  requiereAutorizacion: { type: Boolean, default: false },
  activo: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Prestacion', prestacionSchema);
