const Doctor = require('../models/Doctor');
const User = require('../models/User');

exports.getDoctors = async (req, res) => {
  try {
    const [legacyDoctors, staffDoctors] = await Promise.all([
      Doctor.find(),
      User.find({ rol: { $in: ['medico', 'admin'] } })
        .select('nombre email telefono especialidad')
        .sort({ nombre: 1 })
    ]);

    const normalizedLegacy = legacyDoctors.map((d) => ({
      _id: d._id,
      nombre: d.name,
      name: d.name,
      especialidad: d.specialty,
      specialty: d.specialty,
      email: d.email,
      telefono: d.phone,
      phone: d.phone,
    }));

    const normalizedStaff = staffDoctors.map((u) => ({
      _id: u._id,
      nombre: u.nombre,
      name: u.nombre,
      especialidad: u.especialidad || '',
      specialty: u.especialidad || '',
      email: u.email,
      telefono: u.telefono,
      phone: u.telefono,
    }));

    const dedupByEmail = new Map();
    for (const doctor of [...normalizedStaff, ...normalizedLegacy]) {
      const key = (doctor.email || doctor._id.toString()).toLowerCase();
      if (!dedupByEmail.has(key)) dedupByEmail.set(key, doctor);
    }

    const doctors = Array.from(dedupByEmail.values()).sort((a, b) =>
      (a.nombre || a.name || '').localeCompare(b.nombre || b.name || '')
    );

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo doctores', error });
  }
};

exports.createDoctor = async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json(doctor);
  } catch (error) {
    res.status(400).json({ message: 'Error creando doctor', error });
  }
};
