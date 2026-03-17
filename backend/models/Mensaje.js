const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  de: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  para: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: String, required: true }, // formato: "userId1_userId2" (IDs ordenados)
  contenido: { type: String, required: true, maxlength: 2000 },
  leido: { type: Boolean, default: false },
}, { timestamps: true });

mensajeSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model('Mensaje', mensajeSchema);
