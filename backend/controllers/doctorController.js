const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AgendaMedica = require('../models/AgendaMedica');
const Rating = require('../models/Rating');

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

exports.getDoctors = async (req, res) => {
  try {
    const { especialidad, search } = req.query;

    const [legacyDoctors, staffDoctors] = await Promise.all([
      Doctor.find(),
      User.find({ rol: { $in: ['medico', 'admin'] } })
        .select('nombre email telefono especialidad horariosAtencion direccionConsultorio matriculaProfesional fotoPerfil bio redesSociales')
        .sort({ nombre: 1 })
    ]);

    const staffIds = staffDoctors.map((u) => u._id);
    const agendasFijas = staffIds.length > 0
      ? await AgendaMedica.find({
          medico: { $in: staffIds },
          tipo: 'fijo',
          disponible: true
        }).select('medico dia horaInicio horaFin')
      : [];

    const agendaPorMedico = new Map();
    for (const a of agendasFijas) {
      const key = String(a.medico);
      if (!agendaPorMedico.has(key)) {
        agendaPorMedico.set(key, []);
      }
      agendaPorMedico.get(key).push({
        dia: DIAS_SEMANA[a.dia] || 'Lunes',
        horaInicio: a.horaInicio,
        horaFin: a.horaFin
      });
    }

    // Obtener ratings para todos los médicos
    const ratings = await Rating.find({ medico: { $in: staffIds } });
    const ratingsPorMedico = new Map();
    ratings.forEach(rating => {
      const key = String(rating.medico);
      if (!ratingsPorMedico.has(key)) {
        ratingsPorMedico.set(key, []);
      }
      ratingsPorMedico.get(key).push(rating.calificacion);
    });

    const normalizedLegacy = legacyDoctors.map((d) => ({
      _id: d._id,
      nombre: d.name,
      name: d.name,
      especialidad: d.specialty,
      specialty: d.specialty,
      email: d.email,
      telefono: d.phone,
      phone: d.phone,
      horariosAtencion: [],
      direccionConsultorio: '',
      matriculaProfesional: '',
      fotoPerfil: '',
      bio: '',
      redesSociales: {},
      promedioRating: 0,
      totalRatings: 0
    }));

    const normalizedStaff = staffDoctors.map((u) => {
      const calificaciones = ratingsPorMedico.get(String(u._id)) || [];
      const promedio = calificaciones.length > 0
        ? (calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length).toFixed(2)
        : 0;

      return {
        _id: u._id,
        nombre: u.nombre,
        name: u.nombre,
        especialidad: u.especialidad || '',
        specialty: u.especialidad || '',
        email: u.email,
        telefono: u.telefono,
        phone: u.telefono,
        horariosAtencion: (u.horariosAtencion && u.horariosAtencion.length > 0)
          ? u.horariosAtencion
          : (agendaPorMedico.get(String(u._id)) || []),
        direccionConsultorio: u.direccionConsultorio || '',
        matriculaProfesional: u.matriculaProfesional || '',
        fotoPerfil: u.fotoPerfil || '',
        bio: u.bio || '',
        redesSociales: u.redesSociales || {},
        promedioRating: parseFloat(promedio),
        totalRatings: calificaciones.length
      };
    });

    const dedupByEmail = new Map();
    for (const doctor of [...normalizedStaff, ...normalizedLegacy]) {
      const key = (doctor.email || doctor._id.toString()).toLowerCase();
      if (!dedupByEmail.has(key)) dedupByEmail.set(key, doctor);
    }

    let doctors = Array.from(dedupByEmail.values()).sort((a, b) =>
      (a.nombre || a.name || '').localeCompare(b.nombre || b.name || '')
    );

    // Filtrar por especialidad si se proporciona
    if (especialidad) {
      doctors = doctors.filter(d => 
        d.especialidad && d.especialidad.toLowerCase().includes(especialidad.toLowerCase())
      );
    }

    // Filtrar por búsqueda si se proporciona
    if (search) {
      const searchLower = search.toLowerCase();
      doctors = doctors.filter(d => 
        (d.nombre && d.nombre.toLowerCase().includes(searchLower)) ||
        (d.especialidad && d.especialidad.toLowerCase().includes(searchLower)) ||
        (d.email && d.email.toLowerCase().includes(searchLower))
      );
    }

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo doctores', error });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const doctor = await User.findById(id)
      .select('nombre email telefono especialidad horariosAtencion direccionConsultorio matriculaProfesional fotoPerfil bio redesSociales');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    // Obtener ratings
    const ratings = await Rating.find({ medico: id });
    const calificaciones = ratings.map(r => r.calificacion);
    const promedio = calificaciones.length > 0
      ? (calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length).toFixed(2)
      : 0;

    res.json({
      ...doctor.toObject(),
      promedioRating: parseFloat(promedio),
      totalRatings: ratings.length,
      ratings: ratings.map(r => ({
        calificacion: r.calificacion,
        comentario: r.comentario,
        pacienteNombre: r.paciente,
        fecha: r.fechaCreacion
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo doctor', error });
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

