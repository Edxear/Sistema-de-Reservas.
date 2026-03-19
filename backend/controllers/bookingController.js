const Booking = require('../models/Booking');
const HistoriaClinica = require('../models/HistoriaClinica');
const Service = require('../models/Service');
const User = require('../models/User');

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

let bookingIndexSyncPromise;

async function syncBookingIndexes() {
  if (!bookingIndexSyncPromise) {
    bookingIndexSyncPromise = (async () => {
      try {
        await Booking.collection.dropIndex('fecha_1_hora_1_servicio_1');
      } catch (error) {
        if (!['IndexNotFound', 'NamespaceNotFound'].includes(error.codeName)) throw error;
      }

      await Booking.collection.createIndex(
        { fecha: 1, hora: 1, medico: 1 },
        { unique: true, partialFilterExpression: { medico: { $exists: true } } }
      );
    })();
  }

  return bookingIndexSyncPromise;
}

function inferirEspecialidadPorServicio(serviceName = '') {
  const n = serviceName.toLowerCase();
  if (n.includes('neurolog')) return 'neurologia';
  if (n.includes('traumatolog') || n.includes('osteo')) return 'traumatologia';
  if (n.includes('pediatr')) return 'pediatria';
  if (n.includes('cardiolog')) return 'cardiologia';
  if (n.includes('clinica')) return 'clinica medica';
  return '';
}

function normalizarFecha(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function horaAMinutos(hora) {
  const [hours, minutes] = hora.split(':').map(Number);
  return (hours * 60) + minutes;
}

function estaEnHorario(hora, duracion, bloques) {
  const inicio = horaAMinutos(hora);
  const fin = inicio + duracion;

  return bloques.some((bloque) => {
    const bloqueInicio = horaAMinutos(bloque.horaInicio);
    const bloqueFin = horaAMinutos(bloque.horaFin);
    return inicio >= bloqueInicio && fin <= bloqueFin;
  });
}

async function validarDisponibilidad({ medicoId, fecha, hora, servicioId, bookingId }) {
  const [medico, servicio] = await Promise.all([
    User.findById(medicoId).select('rol horariosAtencion nombre especialidad'),
    Service.findById(servicioId).select('duracion nombre')
  ]);

  if (!medico || !['medico', 'admin'].includes(medico.rol)) {
    return { ok: false, status: 400, message: 'Debe seleccionar un profesional valido' };
  }

  if (!servicio) {
    return { ok: false, status: 400, message: 'Servicio no encontrado' };
  }

  const especialidadRequerida = inferirEspecialidadPorServicio(servicio.nombre);
  const especialidadMedico = (medico.especialidad || '').toLowerCase();
  if (especialidadRequerida && !especialidadMedico.includes(especialidadRequerida)) {
    return { ok: false, status: 409, message: 'El profesional seleccionado no atiende ese tipo de consulta' };
  }

  const fechaNormalizada = normalizarFecha(fecha);
  const diaSemana = DIAS_SEMANA[fechaNormalizada.getDay()];
  const bloquesDia = (medico.horariosAtencion || []).filter((bloque) => bloque.dia === diaSemana);

  if (!estaEnHorario(hora, servicio.duracion, bloquesDia)) {
    return {
      ok: false,
      status: 409,
      message: `El profesional no atiende ${servicio.nombre} en ese horario (${diaSemana})`
    };
  }

  const conflicto = await Booking.findOne({
    _id: bookingId ? { $ne: bookingId } : { $exists: true },
    medico: medicoId,
    fecha: fechaNormalizada,
    hora,
    estado: { $in: ['pendiente', 'confirmada', 'reprogramada'] }
  }).select('_id');

  if (conflicto) {
    return { ok: false, status: 409, message: 'El profesional ya tiene una consulta asignada en ese horario' };
  }

  return { ok: true, medico, servicio, fechaNormalizada };
}

function puedeCambiarEstado(reqUser, booking, nuevoEstado) {
  if (reqUser?.rol === 'admin') return true;
  if (reqUser?.rol === 'paciente' && String(booking.usuario) === String(reqUser.id) && nuevoEstado === 'cancelada') {
    return ['pendiente', 'confirmada', 'reprogramada'].includes(booking.estado);
  }
  return false;
}

exports.getBookingMetrics = async (req, res) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden ver metricas' });
    }

    const period = req.query.period || '7d';
    const now = new Date();
    const startRange = new Date(now);

    if (period === 'today') {
      startRange.setHours(0, 0, 0, 0);
    } else if (period === '30d') {
      startRange.setDate(startRange.getDate() - 29);
      startRange.setHours(0, 0, 0, 0);
    } else {
      startRange.setDate(startRange.getDate() - 6);
      startRange.setHours(0, 0, 0, 0);
    }

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(startToday);
    endToday.setDate(endToday.getDate() + 1);

    const [total, byEstadoAgg, todayTotal, trendAgg] = await Promise.all([
      Booking.countDocuments({}),
      Booking.aggregate([
        { $match: { fecha: { $gte: startRange } } },
        { $group: { _id: '$estado', count: { $sum: 1 } } }
      ]),
      Booking.countDocuments({ fecha: { $gte: startToday, $lt: endToday } }),
      Booking.aggregate([
        { $match: { fecha: { $gte: startRange } } },
        {
          $group: {
            _id: {
              y: { $year: '$fecha' },
              m: { $month: '$fecha' },
              d: { $dayOfMonth: '$fecha' }
            },
            total: { $sum: 1 }
          }
        },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
      ])
    ]);

    const byEstado = {
      pendiente: 0,
      confirmada: 0,
      cancelada: 0,
      reprogramada: 0,
      ausente: 0,
      atendida: 0,
    };

    for (const row of byEstadoAgg) {
      if (Object.prototype.hasOwnProperty.call(byEstado, row._id)) {
        byEstado[row._id] = row.count;
      }
    }

    const trend = trendAgg.map((row) => ({
      label: `${String(row._id.d).padStart(2, '0')}/${String(row._id.m).padStart(2, '0')}`,
      total: row.total,
    }));

    res.json({ total, todayTotal, byEstado, period, trend });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo metricas de turnos', error });
  }
};

exports.getPatientSummaries = async (req, res) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden ver resumen de pacientes' });
    }

    const bookings = await Booking.find({})
      .populate('usuario servicio medico', 'nombre email telefono obraSocial numeroAfiliado alergias especialidad')
      .sort({ fecha: -1, hora: -1 })
      .limit(1000);

    const now = new Date();
    const map = new Map();

    for (const booking of bookings) {
      if (!booking.usuario?._id) continue;

      const key = booking.usuario._id.toString();
      if (!map.has(key)) {
        map.set(key, {
          pacienteId: key,
          nombre: booking.usuario.nombre || 'Paciente',
          email: booking.usuario.email || '',
          telefono: booking.usuario.telefono || '',
          obraSocial: booking.usuario.obraSocial || '',
          numeroAfiliado: booking.usuario.numeroAfiliado || '',
          alergias: booking.usuario.alergias || '',
          totalTurnos: 0,
          proximosTurnos: 0,
          ultimoTurno: null,
          proximoTurno: null,
        });
      }

      const summary = map.get(key);
      summary.totalTurnos += 1;

      const fechaTurno = new Date(booking.fecha);
      const estadoActivo = ['pendiente', 'confirmada', 'reprogramada'];
      const estadoAtendido = ['atendida', 'completada'];

      if (estadoActivo.includes(booking.estado) && fechaTurno >= now) {
        summary.proximosTurnos += 1;
        if (!summary.proximoTurno || fechaTurno < new Date(summary.proximoTurno.fecha)) {
          summary.proximoTurno = {
            fecha: fechaTurno,
            hora: booking.hora,
            servicio: booking.servicio?.nombre || 'Servicio',
            profesional: booking.medico?.nombre || 'Profesional',
            estado: booking.estado,
          };
        }
      }

      if (estadoAtendido.includes(booking.estado)) {
        if (!summary.ultimoTurno || fechaTurno > new Date(summary.ultimoTurno.fecha)) {
          summary.ultimoTurno = {
            fecha: fechaTurno,
            hora: booking.hora,
            servicio: booking.servicio?.nombre || 'Servicio',
            profesional: booking.medico?.nombre || 'Profesional',
            estado: booking.estado,
          };
        }
      }
    }

    const items = Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo resumen de pacientes', error });
  }
};

exports.getBookings = async (req, res) => {
  try {
    await syncBookingIndexes();
    const { usuario, servicio, estado, fecha, medico, page = 1, limit = 10 } = req.query;
    const query = {};

    // Los pacientes solo pueden ver sus propias reservas
    if (req.user?.rol === 'paciente') {
      query.usuario = req.user.id;
    }

    // Solo los admin/medico pueden filtrar por otros usuarios
    if (req.user?.rol !== 'paciente' && usuario) query.usuario = usuario;

    if (servicio) query.servicio = servicio;
    if (medico) query.medico = medico;
    if (estado) query.estado = estado;
    if (fecha) query.fecha = normalizarFecha(fecha);

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('usuario', 'nombre telefono email obraSocial numeroAfiliado alergias')
      .populate('servicio', 'nombre duracion precio descripcion')
      .populate('medico', 'nombre especialidad matriculaProfesional horariosAtencion')
      .sort({ fecha: 1, hora: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const pacienteIds = [...new Set(
      bookings
        .map((b) => b.usuario?._id?.toString())
        .filter(Boolean)
    )];

    const historiales = pacienteIds.length > 0
      ? await HistoriaClinica.find({ paciente: { $in: pacienteIds } })
          .select('paciente fecha descripcion')
          .sort({ fecha: -1 })
      : [];

    const historialPorPaciente = new Map();
    for (const h of historiales) {
      const key = h.paciente.toString();
      if (!historialPorPaciente.has(key)) {
        historialPorPaciente.set(key, { cantidadRegistros: 0, atenciones: [] });
      }
      const data = historialPorPaciente.get(key);
      data.cantidadRegistros += 1;
      if (data.atenciones.length < 3) {
        data.atenciones.push({ fecha: h.fecha, tratamiento: h.descripcion });
      }
    }

    const bookingsConHistorial = bookings.map((b) => {
      const pacienteId = b.usuario?._id?.toString();
      const historial = pacienteId
        ? historialPorPaciente.get(pacienteId) || { cantidadRegistros: 0, atenciones: [] }
        : { cantidadRegistros: 0, atenciones: [] };

      return {
        ...b.toObject(),
        historial,
      };
    });

    res.json({ total, page: parseInt(page, 10), limit: parseInt(limit, 10), bookings: bookingsConHistorial });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo reservas', error });
  }
};

exports.createBooking = async (req, res) => {
  try {
    await syncBookingIndexes();
    const disponibilidad = await validarDisponibilidad({
      medicoId: req.body.medico,
      fecha: req.body.fecha,
      hora: req.body.hora,
      servicioId: req.body.servicio,
    });

    if (!disponibilidad.ok) {
      return res.status(disponibilidad.status).json({ message: disponibilidad.message });
    }

    const booking = new Booking({
      ...req.body,
      fecha: disponibilidad.fechaNormalizada,
    });
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Reserva duplicada para el profesional en la fecha y hora seleccionadas' });
    }
    res.status(400).json({ message: 'Error creando reserva', error });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    await syncBookingIndexes();
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });

    if (req.body?.estado && !puedeCambiarEstado(req.user, booking, req.body.estado)) {
      return res.status(403).json({ message: 'No tienes permisos para cambiar el estado del turno' });
    }

    const payload = { ...req.body };

    if (payload.fecha || payload.hora || payload.medico || payload.servicio) {
      if (req.user?.rol !== 'admin') {
        return res.status(403).json({ message: 'Solo administradores pueden reprogramar o reasignar turnos' });
      }

      const disponibilidad = await validarDisponibilidad({
        medicoId: payload.medico || booking.medico,
        fecha: payload.fecha || booking.fecha,
        hora: payload.hora || booking.hora,
        servicioId: payload.servicio || booking.servicio,
        bookingId: booking._id,
      });

      if (!disponibilidad.ok) {
        return res.status(disponibilidad.status).json({ message: disponibilidad.message });
      }

      payload.fecha = disponibilidad.fechaNormalizada;
      if (!payload.estado) {
        payload.estado = 'reprogramada';
      }
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, payload, { new: true })
      .populate('usuario servicio medico', 'nombre especialidad matriculaProfesional horariosAtencion');
    res.json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'El profesional ya tiene una consulta asignada en ese horario' });
    }
    res.status(400).json({ message: 'Error actualizando reserva', error });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
    res.json({ message: 'Reserva eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando reserva', error });
  }
};
