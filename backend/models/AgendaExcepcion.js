const mongoose = require('mongoose');

const agendaExcepcionSchema = new mongoose.Schema({
  medico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    validate: {
      validator: async function (v) {
        const user = await mongoose.model('User').findById(v);
        return user && user.rol === 'medico';
      },
      message: 'El usuario debe ser un médico'
    }
  },
  fecha: {
    type: Date,
    required: true,
    help: 'Día completo de la excepción'
  },
  tipoExcepcion: {
    type: String,
    enum: ['franco', 'feriado', 'cierre_oficina', 'horario_especial', 'reunion', 'capacitacion', 'otra'],
    default: 'otra',
    required: true
  },
  horaInicio: {
    type: String,
    help: 'Opcional: si es null, aplica al día completo. Formato HH:mm',
    validate: {
      validator: function (v) {
        if (!v) return true; // opcional
        return /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'horaInicio debe estar en formato HH:mm'
    }
  },
  horaFin: {
    type: String,
    help: 'Opcional: si es null, aplica al día completo. Formato HH:mm',
    validate: {
      validator: function (v) {
        if (!v) return true; // opcional
        return /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'horaFin debe estar en formato HH:mm'
    }
  },
  disponible: {
    type: Boolean,
    default: false,
    help: 'false = no disponible (franco/feriado). true = disponible pero con restricción (horario especial)'
  },
  razon: {
    type: String,
    maxlength: 250,
    help: 'Descripción de la excepción (ej: "Cirugía programada", "Franco administrativo")'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    help: 'Quién registró esta excepción (admin o médico propietario)'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices
agendaExcepcionSchema.index({ medico: 1, fecha: 1 });
agendaExcepcionSchema.index({ medico: 1, tipoExcepcion: 1 });

// Validación: horaInicio y horaFin deben estar ambos o ninguno
agendaExcepcionSchema.pre('save', function (next) {
  const tieneInicio = !!this.horaInicio;
  const tieneFin = !!this.horaFin;

  if (tieneInicio !== tieneFin) {
    return next(new Error('horaInicio y horaFin deben estar presentes ambos o ninguno'));
  }

  // Si tiene horario parcial, validar que inicio < fin
  if (tieneInicio && tieneFin) {
    const [hI, mI] = this.horaInicio.split(':').map(Number);
    const [hF, mF] = this.horaFin.split(':').map(Number);
    const minInicio = hI * 60 + mI;
    const minFin = hF * 60 + mF;

    if (minInicio >= minFin) {
      return next(new Error('horaInicio debe ser menor a horaFin'));
    }
  }

  next();
});

module.exports = mongoose.model('AgendaExcepcion', agendaExcepcionSchema);
