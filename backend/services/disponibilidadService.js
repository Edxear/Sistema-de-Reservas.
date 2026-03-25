const AgendaMedica = require('../models/AgendaMedica');
const AgendaExcepcion = require('../models/AgendaExcepcion');
const Booking = require('../models/Booking');
const User = require('../models/User');

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

/**
 * Convierte hora string (HH:mm) a minutos desde medianoche
 */
function horaAMinutos(hora) {
  if (!hora || typeof hora !== 'string') return 0;
  const [hours, minutes] = hora.split(':').map(Number);
  return (hours * 60) + minutes;
}

/**
 * Convierte minutos desde medianoche a hora string (HH:mm)
 */
function minutosAHora(minutos) {
  const hours = String(Math.floor(minutos / 60)).padStart(2, '0');
  const mins = String(minutos % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}

/**
 * Normaliza texto: quita acentos y convierte a minúsculas
 */
function normalizarTexto(texto = '') {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Obtiene el nombre del día de la semana para una fecha
 */
function getDiaDeleted(fecha) {
  const date = new Date(`${fecha}T00:00:00`);
  const dayIndex = date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
  return DIAS_SEMANA[dayIndex];
}

/**
 * Obtiene el nombre del día normalizado
 */
function getDiaDeleteNormalizado(fecha) {
  return normalizarTexto(getDiaDeleted(fecha));
}

/**
 * Obtiene la agenda fija (horarios recurrentes) de un médico
 */
async function getAgendaFija(medicoId) {
  try {
    const agendas = await AgendaMedica.find({
      medico: medicoId,
      tipo: 'fijo',
      disponible: true
    });
    return agendas || [];
  } catch (error) {
    console.error('Error obteniendo agenda fija:', error.message);
    return [];
  }
}

/**
 * Obtiene las excepciones (francos, feriados, etc.) de un médico en un rango de fechas
 */
async function getExceptionsByDateRange(medicoId, fechaInicio, fechaFin) {
  try {
    const excepciones = await AgendaExcepcion.find({
      medico: medicoId,
      fecha: { $gte: new Date(fechaInicio + 'T00:00:00'), $lte: new Date(fechaFin + 'T23:59:59') }
    });
    return excepciones || [];
  } catch (error) {
    console.error('Error obteniendo excepciones:', error.message);
    return [];
  }
}

/**
 * Obtiene los bookings confirmados, pendientes o reprogramados para un médico en una fecha
 */
async function getBookingsPorFecha(medicoId, fecha, excludeBookingId = '') {
  try {
    const query = {
      medico: medicoId,
      fecha: new Date(`${fecha}T00:00:00`),
      estado: { $in: ['pendiente', 'confirmada', 'reprogramada'] }
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const bookings = await Booking.find(query);
    return bookings || [];
  } catch (error) {
    console.error('Error obteniendo bookings:', error.message);
    return [];
  }
}

/**
 * Verifica si existe una excepción que afecte a un horario específico
 */
function tieneExcepcion(excepciones, hora, horaFin) {
  const horaMinutos = horaAMinutos(hora);
  const horaFinMinutos = horaAMinutos(horaFin);

  for (const exc of excepciones) {
    // Excepción de día completo -> no hay disponibilidad
    if (!exc.horaInicio && !exc.horaFin) {
      return true;
    }

    // Excepción parcial (horario especial)
    if (exc.horaInicio && exc.horaFin) {
      const excInicio = horaAMinutos(exc.horaInicio);
      const excFin = horaAMinutos(exc.horaFin);

      // Si el slot solapea con la excepción
      if (horaMinutos < excFin && horaFinMinutos > excInicio) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calcula los slots disponibles para un médico en una fecha específica
 * @param {string} medicoId - ID del médico
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {number} duracion - Duración en minutos (default: 30)
 * @param {string} excludeBookingId - ID de booking a excluir (para reprogramar)
 * @returns {array} Array de horarios disponibles [09:00, 09:30, ...]
 */
async function getSlotsByDate(medicoId, fecha, duracion = 30, excludeBookingId = '') {
  try {
    // Validar médico existe
    const medico = await User.findById(medicoId);
    if (!medico || medico.rol !== 'medico') {
      throw new Error('Médico no encontrado o usuario inválido');
    }

    // Validar fecha no esté en el pasado
    const fechaObj = new Date(`${fecha}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaObj < hoy) {
      return [];
    }

    const slots = [];

    // Obtener agenda fija (horarios recurrentes del día de la semana)
    const agendaFija = await getAgendaFija(medicoId);
    const diaNormalizado = getDiaDeleteNormalizado(fecha);
    const bloquesDia = agendaFija.filter((bloque) => bloque.dia !== undefined && normalizarTexto(DIAS_SEMANA[bloque.dia]) === diaNormalizado);

    if (bloquesDia.length === 0) {
      // No hay horario fijo para este día
      return [];
    }

    // Obtener excepciones para esta fecha
    const excepciones = await getExceptionsByDateRange(medicoId, fecha, fecha);

    // Obtener bookings reservados
    const bookings = await getBookingsPorFecha(medicoId, fecha, excludeBookingId);
    const horasReservadas = new Set(bookings.map((b) => b.hora));

    // Calcular slots en cada bloque horario
    for (const bloque of bloquesDia) {
      const inicio = horaAMinutos(bloque.horaInicio);
      const fin = horaAMinutos(bloque.horaFin);

      for (let current = inicio; current + duracion <= fin; current += duracion) {
        const slot = minutosAHora(current);
        const slotFin = minutosAHora(current + duracion);

        // Verificar que el slot no esté reservado
        if (horasReservadas.has(slot)) {
          continue;
        }

        // Verificar que no hay excepción
        if (tieneExcepcion(excepciones, slot, slotFin)) {
          continue;
        }

        slots.push(slot);
      }
    }

    return slots;
  } catch (error) {
    console.error('Error en getSlotsByDate:', error.message);
    throw error;
  }
}

/**
 * Valida si un horario específico está disponible
 */
async function isSlotAvailable(medicoId, fecha, hora, duracion = 30, excludeBookingId = '') {
  try {
    const slots = await getSlotsByDate(medicoId, fecha, duracion, excludeBookingId);
    return slots.includes(hora);
  } catch (error) {
    console.error('Error en isSlotAvailable:', error.message);
    throw error;
  }
}

/**
 * Obtiene la agenda semanal de un médico
 * @returns {object} Mapa con estructura { 'lunes': [{horaInicio, horaFin}], ... }
 */
async function getWeekSchedule(medicoId) {
  try {
    const agendaFija = await getAgendaFija(medicoId);

    const schedule = {};
    DIAS_SEMANA.forEach((dia) => {
      schedule[normalizarTexto(dia)] = [];
    });

    agendaFija.forEach((bloque) => {
      const diaNombra = DIAS_SEMANA[bloque.dia];
      const diaNormalizado = normalizarTexto(diaNombra);
      schedule[diaNormalizado].push({
        horaInicio: bloque.horaInicio,
        horaFin: bloque.horaFin,
        disponible: bloque.disponible
      });
    });

    return schedule;
  } catch (error) {
    console.error('Error en getWeekSchedule:', error.message);
    throw error;
  }
}

/**
 * Obtiene las próximas N fechas con disponibilidad para un médico
 * @param {string} medicoId
 * @param {number} diasAdelante - Cuántos días buscar hacia adelante (default: 30)
 * @returns {array} [{value: "2026-03-25", label: "25/03/2026 (Lunes)", slots: 5}, ...]
 */
async function getNextAvailableDates(medicoId, diasAdelante = 30) {
  try {
    const schedule = await getWeekSchedule(medicoId);
    const availableDays = new Set(Object.keys(schedule).filter((dia) => schedule[dia].length > 0));

    const options = [];
    for (let i = 0; i < diasAdelante; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const iso = date.toISOString().slice(0, 10);
      const weekday = getDiaDeleteNormalizado(iso);

      if (availableDays.has(weekday)) {
        // Calcular cuántos slots hay
        const slots = await getSlotsByDate(medicoId, iso, 30);
        if (slots.length > 0) {
          options.push({
            value: iso,
            label: `${date.toLocaleDateString('es-AR')} (${getDiaDeleted(iso)})`,
            slots: slots.length
          });
        }
      }
    }

    return options;
  } catch (error) {
    console.error('Error en getNextAvailableDates:', error.message);
    throw error;
  }
}

module.exports = {
  getSlotsByDate,
  isSlotAvailable,
  getWeekSchedule,
  getExceptionsByDateRange,
  getNextAvailableDates,
  // Helpers
  horaAMinutos,
  minutosAHora,
  getDiaDeleted,
  normalizarTexto
};
