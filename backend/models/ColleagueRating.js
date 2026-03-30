const mongoose = require('mongoose');

const colleagueRatingSchema = new mongoose.Schema({
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedbackType: {
    type: String,
    enum: [
      'soporte_calidad_atencion',
      'clinico_funcionalidad_sistema',
      'clinico_uso_incorrecto',
      'desempeno_no_tecnico',
    ],
    default: 'soporte_calidad_atencion',
  },
  channel: {
    type: String,
    enum: ['gestion_interna_soporte', 'comite_funcional', 'seguridad_capacitacion', 'rrhh_derivado'],
    default: 'gestion_interna_soporte',
  },
  destinationArea: {
    type: String,
    default: 'gestion_interna_equipo',
  },
  status: {
    type: String,
    enum: ['registrado', 'en_revision', 'derivado', 'cerrado'],
    default: 'registrado',
  },
  formalized: {
    type: Boolean,
    default: true,
  },
  actionItem: {
    type: String,
    maxlength: 300,
    default: '',
  },
  comentario: {
    type: String,
    maxlength: 400,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

colleagueRatingSchema.index({ targetUser: 1, authorUser: 1, feedbackType: 1 }, { unique: true });
colleagueRatingSchema.index({ targetUser: 1, createdAt: -1 });
colleagueRatingSchema.index({ channel: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ColleagueRating', colleagueRatingSchema);
