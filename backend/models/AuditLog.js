const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  actorRole: {
    type: String,
    default: 'desconocido',
  },
  action: {
    type: String,
    required: true,
    maxlength: 120,
  },
  resourceType: {
    type: String,
    required: true,
    maxlength: 80,
  },
  resourceId: {
    type: String,
    default: '',
    maxlength: 120,
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  details: {
    type: String,
    default: '',
    maxlength: 600,
  },
  ip: {
    type: String,
    default: '',
    maxlength: 120,
  },
  userAgent: {
    type: String,
    default: '',
    maxlength: 400,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorUser: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
