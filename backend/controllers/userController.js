const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const { rol, search } = req.query;
    const query = {};

    if (rol) {
      query.rol = rol;
    }

    if (search) {
      const term = String(search).trim();
      if (term) {
        query.$or = [
          { nombre: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
          { telefono: { $regex: term, $options: 'i' } },
        ];
      }
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ fechaRegistro: -1, nombre: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo usuarios', error });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = String(req.user?.id || '');

    const target = await User.findById(id).select('rol esSuperAdminPrincipal');
    if (!target) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (target.esSuperAdminPrincipal && actorId !== String(id)) {
      return res.status(403).json({ message: 'El superadmin principal solo puede eliminar su propia cuenta' });
    }

    if (actorId === String(id) && !target.esSuperAdminPrincipal) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario desde este modulo' });
    }

    await User.deleteOne({ _id: id });
    return res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error eliminando usuario', error });
  }
};
