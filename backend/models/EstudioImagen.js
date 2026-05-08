const mongoose = require('mongoose');

// Catálogo de estudios de imágenes disponibles
const estudioImagenSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, maxlength: 30 },
  nombre: { type: String, required: true, maxlength: 200 },
  modalidad: {
    type: String,
    enum: ['RX', 'ECO', 'TAC', 'RM', 'PET', 'MAMOGRAFIA', 'ENDOSCOPIA', 'OTRO'],
    default: 'RX',
    index: true,
  },
  duracionMinutos: { type: Number, default: 20 },
  requiereContraste: { type: Boolean, default: false },
  requierePreparacion: { type: Boolean, default: false },
  instruccionesPreparacion: { type: String, default: '', maxlength: 500 },
  equipoNecesario: { type: String, default: '', maxlength: 100 },
  costo: { type: Number, default: 0 },
  activo: { type: Boolean, default: true, index: true },
}, { timestamps: true });

estudioImagenSchema.index({ modalidad: 1, activo: 1 });

module.exports = mongoose.model('EstudioImagen', estudioImagenSchema);
