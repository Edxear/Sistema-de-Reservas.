const mongoose = require('mongoose');

// Factura electrónica emitida al paciente
const facturaSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  numero: { type: String, unique: true, maxlength: 30 },  // número de factura
  fecha: { type: Date, default: Date.now, index: true },

  cargos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cargo' }],

  subtotal: { type: Number, default: 0 },
  descuentoTotal: { type: Number, default: 0 },
  impuestos: { type: Number, default: 0 },
  montoTotal: { type: Number, required: true, min: 0 },

  // Datos fiscales (AFIP u organismo local)
  cae: { type: String, default: '' },           // Código de Autorización Electrónico
  caeFechaVto: { type: Date },
  puntoVenta: { type: Number, default: 1 },
  tipoFactura: { type: String, enum: ['A', 'B', 'C', 'ticket'], default: 'B' },

  estado: {
    type: String,
    enum: ['borrador', 'emitida', 'cobrada', 'anulada'],
    default: 'borrador',
    index: true,
  },

  // Datos del responsable de pago (puede ser el paciente u otra persona)
  responsablePago: {
    nombre: { type: String, default: '' },
    documento: { type: String, default: '' },
    email: { type: String, default: '' },
  },

  generadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  observaciones: { type: String, default: '', maxlength: 400 },
}, { timestamps: true });

facturaSchema.index({ paciente: 1, fecha: -1 });
facturaSchema.index({ estado: 1 });

module.exports = mongoose.model('Factura', facturaSchema);
