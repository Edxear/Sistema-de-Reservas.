/**
 * Gestor de Socket.IO para emitir eventos desde controllers
 * Se inicializa en start.js con setIO(io)
 */

let io = null;

/**
 * Inicializa el manager con la instancia de Socket.IO
 * Llamar desde start.js después de crear io
 */
function setIO(ioInstance) {
  io = ioInstance;
}

/**
 * Emite una notificación a un usuario específico
 * Usa Socket.IO para enviar en tiempo real
 */
function emitirNotificacion(usuarioId, notificacion) {
  if (!io) {
    console.warn('[Socket Manager] io no inicializado, notificación no emitida');
    return;
  }

  // Buscar todas las conexiones del usuario y emitir
  io.to(`usuario_${usuarioId}`).emit('nuevaNotificacion', notificacion);
}

/**
 * Obtiene la instancia de io (para casos especiales)
 */
function getIO() {
  return io;
}

module.exports = {
  setIO,
  emitirNotificacion,
  getIO,
};
