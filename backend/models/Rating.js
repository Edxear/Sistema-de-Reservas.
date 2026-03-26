const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  medico: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  paciente: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  calificacion: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comentario: { 
    type: String, 
    maxlength: 500 
  },
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Índice para evitar múltiples ratings del mismo paciente al mismo médico
ratingSchema.index({ medico: 1, paciente: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
