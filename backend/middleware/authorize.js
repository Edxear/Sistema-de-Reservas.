const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'No tienes permiso para acceder a este recurso' });
    }

    if (req.user.rol === 'superadmin' || req.user.esSuperAdminPrincipal === true) {
      return next();
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permiso para acceder a este recurso' });
    }
    next();
  };
};

module.exports = authorize;
