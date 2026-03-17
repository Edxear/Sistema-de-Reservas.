const User = require('../models/User');

module.exports = async (req, res, next) => {
  if (!req.user?.id) return res.status(401).json({ message: 'No autorizado' });

  try {
    const user = await User.findById(req.user.id);
    if (!user || user.rol !== 'admin') return res.status(403).json({ message: 'Acceso de administrador requerido' });
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error validando administrador', error });
  }
};