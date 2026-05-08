const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
}, { _id: false });

const checkpointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  state: { type: String, enum: ['ok', 'warn', 'danger'], default: 'ok' },
  note: { type: String, default: '', trim: true },
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  event: { type: String, required: true, trim: true },
  eta: { type: String, default: '', trim: true },
}, { _id: false });

const moduleSnapshotSchema = new mongoose.Schema({
  slug: { type: String, required: true, trim: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  allowedRoles: { type: [String], default: [] },
  status: { type: String, enum: ['operativo', 'monitoreo', 'planificado'], default: 'operativo' },
  owner: { type: String, default: '', trim: true },
  lastUpdated: { type: Date, default: Date.now },
  liveMetrics: { type: [metricSchema], default: [] },
  highlights: { type: [String], default: [] },
  checkpoints: { type: [checkpointSchema], default: [] },
  timeline: { type: [timelineSchema], default: [] },
}, { _id: false });

const strategicModuleDomainSnapshotSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  order: { type: Number, default: 99 },
  modules: { type: [moduleSnapshotSchema], default: [] },
}, { timestamps: true });

strategicModuleDomainSnapshotSchema.index({ key: 1 }, { unique: true });
strategicModuleDomainSnapshotSchema.index({ order: 1, title: 1 });

module.exports = mongoose.model('StrategicModuleDomainSnapshot', strategicModuleDomainSnapshotSchema);