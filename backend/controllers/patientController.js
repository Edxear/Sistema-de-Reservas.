const User = require('../models/User');

/**
 * Obtener pacientes con búsqueda opcional por nombre o DNI
 * Query params:
 *   - q: búsqueda por nombre (contiene) o DNI (exact match)
 */
exports.getPatients = async (req, res) => {
  try {
    const { q } = req.query;
    let query = { rol: 'paciente' };

    if (q && q.trim()) {
      const searchTerm = q.trim();
      // Buscar por nombre (regex) o por documento (exact)
      query = {
        ...query,
        $or: [
          { nombre: { $regex: searchTerm, $options: 'i' } },
          { documento: searchTerm }
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
    const patient = await User.findById(id)
      .select('-password');

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
    const { nombre, email, telefono, documento, ...rest } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !telefono) {
      return res.status(400).json({ 
        message: 'Nombre, email y teléfono son obligatorios' 
      });
    }

    // Verificar que el email no exista
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const patient = new User({
      nombre,
      email,
      telefono,
      documento,
      rol: 'paciente',
      ...rest
    });

    await patient.save();
    res.status(201).json(patient.toObject({ getters: true }));
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
