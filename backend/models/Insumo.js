const mongoose = require('mongoose');

// Catálogo de insumos descartables y materiales
const insumoSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, maxlength: 40 },
  nombre: { type: String, required: true, maxlength: 200 },
  descripcion: { type: String, default: '', maxlength: 400 },
  unidadMedida: { type: String, default: 'unidad', maxlength: 30 },
  categoria: {
    type: String,
    enum: ['descartable', 'esteril', 'farmaceutico', 'textil', 'limpieza', 'equipamiento_menor', 'otro'],
    default: 'descartable',
    index: true,
  },
  stockActual: { type: Number, default: 0, min: 0 },
  stockMinimo: { type: Number, default: 10, min: 0 },   // punto de pedido
  stockMaximo: { type: Number, default: 100, min: 0 },
  precioUnitario: { type: Number, default: 0, min: 0 },
  proveedor: { type: String, default: '', maxlength: 100 },
  codigoBarras: { type: String, default: '', maxlength: 60 },
  activo: { type: Boolean, default: true, index: true },
  requiereControl: { type: Boolean, default: false }, // insumos controlados
}, { timestamps: true });

insumoSchema.index({ categoria: 1, activo: 1 });
insumoSchema.index({ stockActual: 1 });

module.exports = mongoose.model('Insumo', insumoSchema);
