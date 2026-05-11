const mongoose = require('mongoose');

// Endpoint de integración externa (LIS, HIS, FHIR server, etc.)
const endpointExternoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, maxlength: 120 },
  url: { type: String, required: true, maxlength: 400 },
  tipo: {
    type: String,
    enum: ['LIS', 'HIS', 'SISA', 'FHIR', 'HL7', 'PACS', 'OTRO'],
    default: 'OTRO',
    index: true,
  },
  authConfig: {
    metodo: { type: String, enum: ['none', 'apiKey', 'basic', 'oauth2', 'mtls'], default: 'none' },
    apiKeyName: { type: String, default: '' },
    tokenUrl: { type: String, default: '' },
    scope: { type: String, default: '' },
  },
  activo: { type: Boolean, default: true, index: true },
  descripcion: { type: String, default: '', maxlength: 300 },
}, { timestamps: true });

endpointExternoSchema.index({ tipo: 1, activo: 1 });
endpointExternoSchema.index({ nombre: 1 });

module.exports = mongoose.model('EndpointExterno', endpointExternoSchema);
