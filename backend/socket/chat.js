const jwt = require('jsonwebtoken');
const Mensaje = require('../models/Mensaje');

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [key, ...rest] = part.split('=');
      acc[key] = decodeURIComponent(rest.join('='));
      return acc;
    }, {});
}

function getRoomId(id1, id2) {
  return [id1, id2].sort().join('_');
}

function iniciarChat(io) {
  // Autenticación via JWT en la conexión
  io.use((socket, next) => {
    const authToken = socket.handshake.auth?.token;
    const cookies = parseCookies(socket.handshake.headers?.cookie || '');
    const cookieToken = cookies.auth_token;
    const token = cookieToken || authToken;
    if (!token) return next(new Error('No autorizado'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRol = decoded.rol;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Usuario conectado: ${socket.userId}`);

    // Unirse automáticamente a la sala personal del usuario para notificaciones
    socket.join(`usuario_${socket.userId}`);

    // Unirse a una sala de chat con otro usuario
    socket.on('joinRoom', async ({ otroUserId }) => {
      if (!otroUserId) return;
      const room = getRoomId(socket.userId, otroUserId);
      socket.join(room);

      // Enviar historial de mensajes (últimos 50)
      try {
        const historial = await Mensaje.find({ room })
          .sort({ createdAt: 1 })
          .limit(50)
          .populate('de', 'nombre');
        socket.emit('historial', historial);
        // Marcar mensajes como leídos
        await Mensaje.updateMany(
          { room, para: socket.userId, leido: false },
          { $set: { leido: true } }
        );
      } catch (err) {
        console.error('[SOCKET] Error al cargar historial:', err.message);
      }
    });

    // Enviar mensaje
    socket.on('enviarMensaje', async ({ paraUserId, contenido }) => {
      if (!paraUserId || !contenido?.trim()) return;
      const room = getRoomId(socket.userId, paraUserId);
      try {
        const mensaje = await Mensaje.create({
          de: socket.userId,
          para: paraUserId,
          room,
          contenido: contenido.trim(),
        });
        const populado = await mensaje.populate('de', 'nombre');
        io.to(room).emit('nuevoMensaje', populado);
      } catch (err) {
        console.error('[SOCKET] Error al guardar mensaje:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Usuario desconectado: ${socket.userId}`);
    });
  });
}

module.exports = { iniciarChat };
