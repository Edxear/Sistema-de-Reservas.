const mongoose = require('mongoose');

const agendaMedicaSchema = new mongoose.Schema({
  medico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: async function (v) {
        const user = await mongoose.model('User').findById(v);
        return user && user.rol === 'medico';
      },
      message: 'El usuario debe ser un médico'
    }
  },
  tipo: {
    type: String,
    enum: ['fijo', 'excepcion'],
    default: 'fijo',
    required: true
  },
  dia: {
    type: Number,
    min: 0,
    max: 6,
    help: '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado'
  },
  horaInicio: {
    type: String,
    validate: {
      validator: (v) => /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(v),
      message: 'horaInicio debe estar en formato HH:mm (ej: 09:00)'
    }
  },
  horaFin: {
    type: String,
    validate: {
      validator: (v) => /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(v),
      message: 'horaFin debe estar en formato HH:mm (ej: 18:00)'
    }
  },
  disponible: {
    type: Boolean,
    default: true
  },
  fechaInicio: {
    type: Date,
    help: 'Para excepciones: fecha de inicio (inclusive). Para horarios fijos: no se usa.'
  },
  fechaFin: {
    type: Date,
    help: 'Para excepciones: fecha de fin (inclusive). Para horarios fijos: no se usa.'
  },
  razon: {
    type: String,
    enum: ['franco', 'feriado', 'cierre_oficina', 'reunion', 'capacitacion', 'otra'],
    default: 'otra',
    help: 'Razón de la excepción (solo para tipo=excepcion)'
  },
  notas: {
    type: String,
    maxlength: 200
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para optimizar queries
agendaMedicaSchema.index({ medico: 1, tipo: 1 });
agendaMedicaSchema.index({ medico: 1, dia: 1 });
agendaMedicaSchema.index({ medico: 1, fechaInicio: 1, fechaFin: 1 });

// Validación: si tipo=fijo, dia debe estar presente; si tipo=excepcion, fechaInicio y fechaFin
agendaMedicaSchema.pre('save', function (next) {
  if (this.tipo === 'fijo' && (this.dia === undefined || this.dia === null)) {
    return next(new Error('Para horarios fijos (tipo=fijo), el campo "dia" es obligatorio'));
  }
  if (this.tipo === 'excepcion' && (!this.fechaInicio || !this.fechaFin)) {
    return next(new Error('Para excepciones (tipo=excepcion), "fechaInicio" y "fechaFin" son obligatorios'));
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AgendaMedica', agendaMedicaSchema);
