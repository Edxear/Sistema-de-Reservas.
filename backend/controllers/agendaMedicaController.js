const AgendaMedica = require('../models/AgendaMedica');
const AgendaExcepcion = require('../models/AgendaExcepcion');
const User = require('../models/User');
const disponibilidadService = require('../services/disponibilidadService');

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

/**
 * GET /api/medicos/:id/disponibilidad
 * Obtiene slots disponibles para una fecha y duración específica
 * Query params: fecha (YYYY-MM-DD), duracion (minutes)
 */
exports.getDisponibilidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, duracion } = req.query;

    if (!fecha || !duracion) {
      return res.status(400).json({ message: 'Parámetros "fecha" y "duracion" son requeridos' });
    }

    const duration = parseInt(duracion, 10);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ message: 'La duración debe ser un número positivo' });
    }

    const slots = await disponibilidadService.getSlotsByDate(id, fecha, duration);
    res.json({ slots });
  } catch (error) {
    console.error('Error en getDisponibilidad:', error.message);
    res.status(500).json({ message: 'Error al consultar disponibilidad', error: error.message });
  }
};

/**
 * GET /api/medicos/:id/proximas-fechas
 * Obtiene las próximas fechas disponibles
 * Query params: dias (default: 45)
 */
exports.getProximasFechas = async (req, res) => {
  try {
    const { id } = req.params;
    const { dias } = req.query;

    const daysAhead = dias ? parseInt(dias, 10) : 45;

    const fechas = await disponibilidadService.getNextAvailableDates(id, daysAhead);
    res.json({ fechas });
  } catch (error) {
    console.error('Error en getProximasFechas:', error.message);
    res.status(500).json({ message: 'Error al consultar próximas fechas', error: error.message });
  }
};

/**
 * POST /api/medicos/:id/agenda
 * Crea o actualiza la agenda semanal de un médico
 * Body: [{ dia: 1, horaInicio: "09:00", horaFin: "18:00", disponible: true }, ...]
 */
exports.createOrUpdateAgenda = async (req, res) => {
  try {
    const { id: medicoId } = req.params;
    const { horarios } = req.body;

    // El middleware ya validó que es admin o el médico propietario

    // Validar médico existe
    const medico = await User.findById(medicoId);
    if (!medico || medico.rol !== 'medico') {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    if (!Array.isArray(horarios) || horarios.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de horarios' });
    }

    // Validar y guardar horarios
    const savedHorarios = [];
    for (const horario of horarios) {
      const { dia, horaInicio, horaFin } = horario;

      // Validaciones
      if (dia === undefined || dia === null || dia < 0 || dia > 6) {
        return res.status(400).json({ message: `día inválido: ${dia}. Debe estar entre 0 y 6` });
      }
      if (!horaInicio || !horaFin) {
        return res.status(400).json({ message: 'horaInicio y horaFin son requeridos' });
      }

      // Verificar si ya existe agenda para este día
      const existente = await AgendaMedica.findOne({
        medico: medicoId,
        tipo: 'fijo',
        dia
      });

      if (existente) {
        // Actualizar
        existente.horaInicio = horaInicio;
        existente.horaFin = horaFin;
        existente.disponible = horario.disponible !== false;
        await existente.save();
        savedHorarios.push(existente);
      } else {
        // Crear nuevo
        const newAgenda = new AgendaMedica({
          medico: medicoId,
          tipo: 'fijo',
          dia,
          horaInicio,
          horaFin,
          disponible: horario.disponible !== false
        });
        await newAgenda.save();
        savedHorarios.push(newAgenda);
      }
    }

    // Marcar como migrado a nueva agenda
    await User.updateOne(
      { _id: medicoId },
      {
        'agendaConfiguracion.tipo': 'nueva_agenda',
        'agendaConfiguracion.migradoEl': new Date()
      }
    );

    res.json({ message: 'Agenda actualizada correctamente', horarios: savedHorarios });
  } catch (error) {
    console.error('Error en createOrUpdateAgenda:', error.message);
    res.status(500).json({ message: 'Error al actualizar agenda', error: error.message });
  }
};

/**
 * DELETE /api/medicos/:id/agenda/:dia
 * Elimina el horario de un día específico
 */
exports.deleteAgendaDia = async (req, res) => {
  try {
    const { id: medicoId, dia } = req.params;

    // El middleware ya validó que es admin o el médico propietario

    const diaNum = parseInt(dia, 10);
    if (isNaN(diaNum) || diaNum < 0 || diaNum > 6) {
      return res.status(400).json({ message: 'Día inválido' });
    }

    const result = await AgendaMedica.deleteOne({
      medico: medicoId,
      tipo: 'fijo',
      dia: diaNum
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No se encontró agenda para ese día' });
    }

    res.json({ message: 'Día eliminado de la agenda' });
  } catch (error) {
    console.error('Error en deleteAgendaDia:', error.message);
    res.status(500).json({ message: 'Error al eliminar agenda', error: error.message });
  }
};

/**
 * POST /api/medicos/:id/excepciones
 * Crea una excepción (franco, feriado, etc.)
 * Body: { fecha: "2026-03-25", tipoExcepcion: "franco", horaInicio?: "09:00", horaFin?: "13:00", razon: "Franco administrativo" }
 */
exports.createExcepcion = async (req, res) => {
  try {
    const { id: medicoId } = req.params;
    const { fecha, tipoExcepcion, horaInicio, horaFin, razon } = req.body;

    // El middleware ya validó que es admin o el médico propietario

    // Validaciones básicas
    if (!fecha || !tipoExcepcion) {
      return res.status(400).json({ message: 'fecha y tipoExcepcion son obligatorios' });
    }

    const excepcion = new AgendaExcepcion({
      medico: medicoId,
      fecha: new Date(fecha + 'T00:00:00'),
      tipoExcepcion,
      horaInicio: horaInicio || null,
      horaFin: horaFin || null,
      disponible: ['horario_especial'].includes(tipoExcepcion),
      razon: razon || '',
      createdBy: req.user._id
    });

    await excepcion.save();
    res.status(201).json({ message: 'Excepción creada correctamente', excepcion });
  } catch (error) {
    console.error('Error en createExcepcion:', error.message);
    res.status(500).json({ message: 'Error al crear excepción', error: error.message });
  }
};

/**
 * GET /api/medicos/:id/excepciones
 * Lista todas las excepciones de un médico
 * Query params: fechaInicio, fechaFin (para filtrar por rango)
 * Requiere auth + ser médico o admin
 */
exports.getExcepciones = async (req, res) => {
  try {
    const { id: medicoId } = req.params;
    const { fechaInicio, fechaFin } = req.query;

    // El middleware medicoOrAdmin ya validó que es médico o admin
    // Opcionalmente podemos validar que solo ven sus propias excepciones si son médico
    if (req.user.rol === 'medico' && String(req.user._id) !== String(medicoId)) {
      return res.status(403).json({ message: 'Solo puedes ver tus propias excepciones' });
    }

    const query = { medico: medicoId };

    // Si hay rango de fechas, filtrar
    if (fechaInicio && fechaFin) {
      query.fecha = {
        $gte: new Date(fechaInicio + 'T00:00:00'),
        $lte: new Date(fechaFin + 'T23:59:59')
      };
    }

    const excepciones = await AgendaExcepcion.find(query).sort({ fecha: -1 });
    res.json({ excepciones, total: excepciones.length });
  } catch (error) {
    console.error('Error en getExcepciones:', error.message);
    res.status(500).json({ message: 'Error al obtener excepciones', error: error.message });
  }
};

/**
 * DELETE /api/medicos/:id/excepciones/:excepcionId
 * Elimina una excepción específica
 */
exports.deleteExcepcion = async (req, res) => {
  try {
    const { id: medicoId, excepcionId } = req.params;

    // El middleware ya validó que es admin o el médico propietario

    const result = await AgendaExcepcion.deleteOne({
      _id: excepcionId,
      medico: medicoId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Excepción no encontrada' });
    }

    res.json({ message: 'Excepción eliminada correctamente' });
  } catch (error) {
    console.error('Error en deleteExcepcion:', error.message);
    res.status(500).json({ message: 'Error al eliminar excepción', error: error.message });
  }
};

/**
 * GET /api/medicos/:id/agenda/semanal
 * Obtiene la agenda semanal completa (horarios fijos)
 */
exports.getAgendaSemanal = async (req, res) => {
  try {
    const { id: medicoId } = req.params;

    const schedule = await disponibilidadService.getWeekSchedule(medicoId);
    res.json({ schedule });
  } catch (error) {
    console.error('Error en getAgendaSemanal:', error.message);
    res.status(500).json({ message: 'Error al obtener agenda semanal', error: error.message });
  }
};
