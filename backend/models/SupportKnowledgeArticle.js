const mongoose = require('mongoose');

const supportKnowledgeArticleSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, trim: true },
  titulo: { type: String, required: true, trim: true, maxlength: 180 },
  contenido: { type: String, required: true, trim: true, maxlength: 10000 },
  categoria: { type: String, default: 'general', trim: true },
  tags: { type: [String], default: [] },
  version: { type: Number, default: 1, min: 1 },
  estado: { type: String, enum: ['borrador', 'publicado', 'archivado'], default: 'publicado' },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicadoAt: { type: Date, default: Date.now },
}, { timestamps: true });

supportKnowledgeArticleSchema.index({ categoria: 1, estado: 1, updatedAt: -1 });

module.exports = mongoose.model('SupportKnowledgeArticle', supportKnowledgeArticleSchema);
