const mongoose = require('mongoose');

// Movimientos de stock: entradas (compra) y salidas (consumo)
const movimientoStockSchema = new mongoose.Schema({
  insumo: { type: mongoose.Schema.Types.ObjectId, ref: 'Insumo', required: true, index: true },
  tipo: {
    type: String,
    enum: ['entrada', 'salida', 'ajuste_positivo', 'ajuste_negativo', 'devolucion', 'vencimiento'],
    required: true,
    index: true,
  },
  cantidad: { type: Number, required: true, min: 0 },
  stockResultante: { type: Number, required: true, min: 0 },
  fecha: { type: Date, default: Date.now, index: true },

  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  servicioDestino: { type: String, default: '', maxlength: 100 },
  lote: { type: String, default: '', maxlength: 60 },       // número de lote del insumo
  fechaVencimientoLote: { type: Date },

  // Vínculo con un paciente (para trazabilidad y cargo automático)
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  admision: { type: mongoose.Schema.Types.ObjectId, ref: 'Admision', default: null },

  motivoAjuste: { type: String, default: '', maxlength: 200 },
  ordenCompra: { type: String, default: '', maxlength: 60 },
}, { timestamps: true });

movimientoStockSchema.index({ insumo: 1, fecha: -1 });
movimientoStockSchema.index({ tipo: 1, fecha: -1 });

module.exports = mongoose.model('MovimientoStock', movimientoStockSchema);
