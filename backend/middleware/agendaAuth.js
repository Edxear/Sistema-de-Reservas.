const User = require('../models/User');

/**
 * Middleware que verifica que el usuario sea:
 * - Admin, O
 * - El médico propietario del recurso
 */
const agendaOwnerOrAdmin = async (req, res, next) => {
  try {
    const { id: medicoId } = req.params;
    const currentUserId = req.user?.id || req.user?._id;
    const currentUserRole = req.user.rol;

    // Admin puede acceder a todo
    if (['admin', 'superadmin'].includes(currentUserRole)) {
      return next();
    }

    // Médico solo puede acceder a su propia agenda
    if (currentUserRole === 'medico') {
      if (String(currentUserId) === String(medicoId)) {
        return next();
      }
      return res.status(403).json({
        message: 'No puedes modificar la agenda de otro médico'
      });
    }

    // Otros roles no pueden acceder
    return res.status(403).json({
      message: 'Solo médicos y admins pueden gestionar agendas'
    });
  } catch (error) {
    console.error('Error en agendaOwnerOrAdmin:', error.message);
    res.status(500).json({ message: 'Error validando permisos' });
  }
};

/**
 * Middleware que verifica que el usuario sea médico o admin
 * (para usuarios que quieren ver su propia agenda)
 */
const medicoOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const { rol } = req.user;
  if (!['medico', 'admin', 'superadmin'].includes(rol)) {
    return res.status(403).json({
      message: 'Solo médicos y admins pueden acceder a esto'
    });
  }

  next();
};

module.exports = {
  agendaOwnerOrAdmin,
  medicoOrAdmin
};
