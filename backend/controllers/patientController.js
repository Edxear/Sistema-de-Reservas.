const User = require('../models/User');

/**
 * Obtener pacientes con búsqueda opcional por nombre o DNI
 * Query params:
 *   - q: búsqueda por nombre (contiene) o DNI (exact match)
 */
exports.getPatients = async (req, res) => {
  try {
    const q = req.query.q || req.query.search;
    let query = { rol: 'paciente' };

    if (q && q.trim()) {
      const searchTerm = q.trim();
      // Buscar por nombre (regex) o por documento (exact)
      query = {
        ...query,
        $or: [
          { nombre: { $regex: searchTerm, $options: 'i' } },
          { documento: searchTerm },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }

    const patients = await User.find(query)
      .select('-password')
      .sort({ nombre: 1 });

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo pacientes', error });
  }
};

/**
 * Obtener un paciente por ID
 */
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await User.findOne({ _id: id, rol: 'paciente' }).select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo paciente', error });
  }
};

/**
 * Crear un nuevo paciente
 */
exports.createPatient = async (req, res) => {
  try {
    const { nombre, email, telefono, documento, password, ...rest } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !telefono) {
      return res.status(400).json({ 
        message: 'Nombre, email y teléfono son obligatorios' 
      });
    }

    // Verificar que el email no exista
    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const patient = new User({
      nombre,
      email: normalizedEmail,
      telefono,
      documento,
      password: password || process.env.DEFAULT_MANAGED_USER_PASSWORD || 'clinica123',
      rol: 'paciente',
      ...rest
    });

    await patient.save();
    const safePatient = patient.toObject({ getters: true });
    delete safePatient.password;
    res.status(201).json(safePatient);
  } catch (error) {
    res.status(400).json({ message: 'Error creando paciente', error });
  }
};

/**
 * Actualizar un paciente
 */
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // No permitir cambios de rol o email
    delete updates.rol;
    delete updates.email;
    delete updates.password;

    const patient = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando paciente', error });
  }
};

/**
 * Eliminar un paciente
 */
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await User.findOneAndDelete({ _id: id, rol: 'paciente' });

    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    res.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ message: 'Error eliminando paciente', error });
  }
};
