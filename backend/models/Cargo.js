const mongoose = require('mongoose');

// Cargo generado automáticamente o manualmente por prestación/servicio
const cargoSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prestacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Prestacion', required: true },

  // Referencia opcional al origen del cargo
  origen: {
    tipo: { type: String, enum: ['consulta', 'orden', 'dispensacion', 'internacion', 'manual'], default: 'manual' },
    referenciaId: { type: String, default: '' },
  },

  fecha: { type: Date, default: Date.now, index: true },
  cantidad: { type: Number, required: true, min: 1, default: 1 },
  precioUnitario: { type: Number, required: true, min: 0 },
  descuento: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },

  cobertura: {
    seguro: { type: String, default: '' },
    numeroAfiliado: { type: String, default: '' },
    planCobertura: { type: String, default: '' },
    porcentajeCubierto: { type: Number, default: 0, min: 0, max: 100 },
    copago: { type: Number, default: 0 },
  },

  estado: {
    type: String,
    enum: ['pendiente', 'facturado', 'cobrado', 'rechazado', 'anulado'],
    default: 'pendiente',
    index: true,
  },

  factura: { type: mongoose.Schema.Types.ObjectId, ref: 'Factura', default: null },
  notas: { type: String, default: '', maxlength: 300 },
}, { timestamps: true });

cargoSchema.index({ paciente: 1, fecha: -1 });
cargoSchema.index({ estado: 1, fecha: -1 });

module.exports = mongoose.model('Cargo', cargoSchema);
