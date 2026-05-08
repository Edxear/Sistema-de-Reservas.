const mongoose = require('mongoose');

// Equipos biomédicos (monitores, ventiladores, desfibriladores, etc.)
const equipoSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, maxlength: 40 },
  nombre: { type: String, required: true, maxlength: 200 },
  tipo: {
    type: String,
    enum: ['monitor', 'ventilador', 'desfibrilador', 'bomba_infusion', 'ecografo', 'rayos_x', 'electrocardiografo', 'autoclave', 'otro'],
    default: 'otro',
    index: true,
  },
  marca: { type: String, default: '', maxlength: 80 },
  modelo: { type: String, default: '', maxlength: 80 },
  numeroSerie: { type: String, default: '', maxlength: 80 },
  servicio: { type: String, default: '', maxlength: 100 },  // ubicación actual
  fechaCompra: { type: Date },
  fechaGarantiaVto: { type: Date },

  estado: {
    type: String,
    enum: ['operativo', 'mantenimiento_preventivo', 'en_reparacion', 'de_baja', 'reserva'],
    default: 'operativo',
    index: true,
  },

  // Siguiente calibración/mantenimiento preventivo
  proximoMantenimiento: { type: Date, index: true },
  frecuenciaMantenimientoMeses: { type: Number, default: 6 },

  proveedor: { type: String, default: '', maxlength: 100 },
  activo: { type: Boolean, default: true, index: true },
  notas: { type: String, default: '', maxlength: 400 },
}, { timestamps: true });

equipoSchema.index({ servicio: 1, estado: 1 });
equipoSchema.index({ proximoMantenimiento: 1, estado: 1 });

module.exports = mongoose.model('Equipo', equipoSchema);
