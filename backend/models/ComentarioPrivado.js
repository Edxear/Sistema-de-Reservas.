const mongoose = require('mongoose');

const comentarioPrivadoSchema = new mongoose.Schema({
  medico: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  autor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  contenido: { 
    type: String, 
    required: true, 
    maxlength: 1000 
  },
  tipoAutor: {
    type: String,
    enum: ['admin', 'director'],
    required: true
  },
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  esPrivado: { 
    type: Boolean, 
    default: true 
  }
});

// Índice para búsquedas rápidas por médico
comentarioPrivadoSchema.index({ medico: 1, fechaCreacion: -1 });

module.exports = mongoose.model('ComentarioPrivado', comentarioPrivadoSchema);
