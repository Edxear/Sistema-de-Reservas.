const mongoose = require('mongoose');

const organigramaAuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'reorder'],
      required: true,
    },
    organigramaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organigrama', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userRol: { type: String, default: '' },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

organigramaAuditSchema.index({ createdAt: -1 });
organigramaAuditSchema.index({ organigramaId: 1, createdAt: -1 });

module.exports = mongoose.model('OrganigramaAudit', organigramaAuditSchema);
