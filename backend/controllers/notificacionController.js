const Notificacion = require('../models/Notificacion');
const { emitirNotificacion } = require('../utils/socketManager');

/**
 * Obtiene todas las notificaciones del usuario actual
 * Query params:
 *   - leido: false (solo no leídas, default: mostrar todas)
 *   - limite: número (default: 50)
 */
exports.getNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { leido, limite = 50 } = req.query;

    // Construir filtro
    const filter = { usuario: usuarioId };
    if (leido !== undefined) {
      filter.leido = leido === 'false' ? false : true;
    }

    // Obtener notificaciones
    const notificaciones = await Notificacion.find(filter)
      .sort({ creado: -1 })
      .limit(parseInt(limite))
      .populate('referencia');

    // Contar no leídas
    const noLeidas = await Notificacion.countDocuments({
      usuario: usuarioId,
      leido: false,
    });

    res.json({
      notificaciones,
      noLeidas,
      total: notificaciones.length,
    });
  } catch (error) {
    console.error('Error en getNotificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

/**
 * Marca una notificación individual como leída
 */
exports.marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: id, usuario: usuarioId },
      { leido: true },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({ notificacion, mensaje: 'Marcada como leída' });
  } catch (error) {
    console.error('Error en marcarComoLeida:', error);
    res.status(500).json({ error: 'Error al marcar como leída' });
  }
};

/**
 * Marca todas las notificaciones del usuario como leídas
 */
exports.marcarTodoComoLeido = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const result = await Notificacion.updateMany(
      { usuario: usuarioId, leido: false },
      { leido: true }
    );

    res.json({
      mensaje: `${result.modifiedCount} notificaciones marcadas como leídas`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error en marcarTodoComoLeido:', error);
    res.status(500).json({ error: 'Error al marcar todas como leídas' });
  }
};

/**
 * Función interna: crear notificación (no es ruta, usada por otros controllers)
 * Llamar desde bookingController, pagoController, etc.
 */
exports.crearNotificacion = async (
  usuarioId,
  tipo,
  mensaje,
  icono = '📬',
  enlace = null,
  referencia = null,
  referenciaModelo = null
) => {
  try {
    const notificacion = new Notificacion({
      usuario: usuarioId,
      tipo,
      titulo: generarTitulo(tipo),
      mensaje,
      icono,
      leido: false,
      enlace,
      referencia,
      referenciaModelo,
    });

    const saved = await notificacion.save();
    // Emitir evento socket para notificación en tiempo real
    emitirNotificacion(usuarioId, saved);
    return saved;
  } catch (error) {
    console.error('Error en crearNotificacion:', error);
    throw error;
  }
};

/**
 * Función auxiliar: generar título basado en tipo
 */
function generarTitulo(tipo) {
  const titulos = {
    reserva_nueva: 'Nueva Reserva',
    reserva_confirmada: 'Reserva Confirmada',
    reserva_cancelada: 'Reserva Cancelada',
    reserva_reprogramada: 'Reserva Reprogramada',
    reserva_atendida: 'Turno Completado',
    mensaje: 'Nuevo Mensaje',
    pago_confirmado: 'Pago Confirmado',
  };
  return titulos[tipo] || 'Notificación';
}
