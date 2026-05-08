const mongoose = require('mongoose');

// Lotes de medicamentos (stock por lote con vencimiento)
const loteMedicamentoSchema = new mongoose.Schema({
  medicamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicamento', required: true, index: true },
  numeroLote: { type: String, required: true, maxlength: 60 },
  fechaVencimiento: { type: Date, required: true, index: true },
  fechaIngreso: { type: Date, default: Date.now },
  stockInicial: { type: Number, required: true, min: 0 },
  stockActual: { type: Number, required: true, min: 0 },
  ubicacion: { type: String, default: '', maxlength: 100 }, // estante, heladera, etc.
  proveedorFactura: { type: String, default: '', maxlength: 100 },
  activo: { type: Boolean, default: true },

  // Alertas automáticas
  alertaVencimiento: { type: Boolean, default: false },
  alertaStockBajo: { type: Boolean, default: false },
}, { timestamps: true });

loteMedicamentoSchema.index({ medicamento: 1, fechaVencimiento: 1 });
loteMedicamentoSchema.index({ stockActual: 1, activo: 1 });

module.exports = mongoose.model('LoteMedicamento', loteMedicamentoSchema);
