const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

const ALLOWED_ROLES = ['medico', 'paciente', 'admin', 'secretaria', 'enfermero', 'superadmin'];

// Light user search for clinical staff — returns limited fields, no admin middleware needed
exports.searchUsers = async (req, res) => {
  try {
    const { rol, search } = req.query;
    const query = {};

    if (rol && ALLOWED_ROLES.includes(String(rol).toLowerCase())) {
      query.rol = String(rol).toLowerCase();
    }

    if (search) {
      const term = String(search).trim();
      if (term.length >= 2) {
        query.$or = [
          { nombre: { $regex: term, $options: 'i' } },
          { documento: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
        ];
      }
    }

    const users = await User.find(query)
      .select('_id nombre email documento rol especialidad')
      .sort({ nombre: 1 })
      .limit(30);

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Error buscando usuarios' });
  }
};

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

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo usuarios' });
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
    await logAuditEvent(req, {
      action: 'user.delete',
      resourceType: 'User',
      resourceId: id,
      details: `Eliminacion de usuario rol=${target.rol}`,
    });
    return res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error eliminando usuario' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = String(req.user?.id || '');

    const target = await User.findById(id).select('+password');
    if (!target) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (target.esSuperAdminPrincipal && actorId !== String(id)) {
      return res.status(403).json({ message: 'Solo el admin principal puede modificar su propia cuenta' });
    }

    const editableFields = [
      'nombre',
      'telefono',
      'rol',
      'areaSecretaria',
      'turnoLaboral',
      'especialidad',
      'matriculaProfesional',
      'direccionConsultorio',
      'bio',
      'documento',
      'direccion',
      'obraSocial',
      'numeroAfiliado',
      'alergias',
    ];

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === 'rol') {
          const nextRole = String(req.body.rol || '').trim().toLowerCase();
          if (!ALLOWED_ROLES.includes(nextRole)) {
            return res.status(400).json({ message: 'Rol invalido' });
          }
          target.rol = nextRole;
        } else {
          target[field] = req.body[field];
        }
      }
    }

    if (req.body.password && String(req.body.password).trim().length >= 6) {
      target.password = String(req.body.password).trim();
    }

    await target.save();
    await logAuditEvent(req, {
      action: 'user.update',
      resourceType: 'User',
      resourceId: id,
      details: 'Actualizacion de datos de usuario desde modulo de administracion',
    });

    const safe = target.toObject();
    delete safe.password;

    return res.json({ message: 'Usuario actualizado correctamente', user: safe });
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando usuario' });
  }
};
