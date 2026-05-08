const mongoose = require('mongoose');

// Pago recibido contra una factura
const pagoSchema = new mongoose.Schema({
  factura: { type: mongoose.Schema.Types.ObjectId, ref: 'Factura', required: true, index: true },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fecha: { type: Date, default: Date.now, index: true },
  monto: { type: Number, required: true, min: 0 },
  medioPago: {
    type: String,
    enum: ['efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'obra_social', 'otro'],
    required: true,
    index: true,
  },
  referencia: { type: String, default: '', maxlength: 100 }, // número de transacción, comprobante
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'rechazado', 'revertido'],
    default: 'pendiente',
    index: true,
  },
  procesadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  observaciones: { type: String, default: '', maxlength: 300 },
}, { timestamps: true });

pagoSchema.index({ factura: 1 });
pagoSchema.index({ paciente: 1, fecha: -1 });

module.exports = mongoose.model('Pago', pagoSchema);
