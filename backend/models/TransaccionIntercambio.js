const mongoose = require('mongoose');

// Trazabilidad de intercambio con sistemas externos
const transaccionIntercambioSchema = new mongoose.Schema({
  endpoint: { type: mongoose.Schema.Types.ObjectId, ref: 'EndpointExterno', default: null, index: true },
  endpointNombre: { type: String, default: '', maxlength: 120 },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  usuarioSolicitante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

  tipoMensaje: {
    type: String,
    enum: ['FHIR_Patient', 'FHIR_Bundle', 'FHIR_Observation', 'HL7_ADT_A04', 'Webhook', 'Otro'],
    default: 'Otro',
    index: true,
  },

  requestPayload: { type: String, default: '' },
  responsePayload: { type: String, default: '' },

  estado: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
    index: true,
  },

  codigoEstadoHttp: { type: Number, default: 200 },
  error: { type: String, default: '', maxlength: 300 },
  fecha: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

transaccionIntercambioSchema.index({ paciente: 1, fecha: -1 });
transaccionIntercambioSchema.index({ tipoMensaje: 1, estado: 1, fecha: -1 });

module.exports = mongoose.model('TransaccionIntercambio', transaccionIntercambioSchema);
