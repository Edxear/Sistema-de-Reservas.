const Receta = require('../models/Receta');
const HistoriaClinica = require('../models/HistoriaClinica');
const User = require('../models/User');
const { crearNotificacion } = require('./notificacionController');

exports.crearReceta = async (req, res) => {
  try {
    const receta = new Receta({
      ...req.body,
      medico: req.user.id
    });
    await receta.save();

    // Registrar receta en historia clínica del paciente
    try {
      const [medicoRef, pacienteRef] = await Promise.all([
        User.findById(req.user.id).select('nombre'),
        User.findById(receta.paciente).select('nombre')
      ]);

      const resumenMedicacion = (receta.medicamentos || [])
        .map((m) => m.nombre)
        .filter(Boolean)
        .slice(0, 4)
        .join(', ');

      await HistoriaClinica.create({
        paciente: receta.paciente,
        medico: req.user.id,
        tipo: 'receta',
        fecha: receta.fechaEmision || new Date(),
        descripcion: `Receta emitida por ${medicoRef?.nombre || 'profesional'} para ${pacienteRef?.nombre || 'paciente'}. Medicación: ${resumenMedicacion || 'sin detalle'}.`
      });
    } catch (histError) {
      console.error('Error registrando receta en historia clínica:', histError.message);
    }

    // Notificar al paciente sobre nueva receta
    try {
      await crearNotificacion(
        receta.paciente,
        'receta_nueva',
        'Tu médico creó una nueva receta para ti. Ya puedes verla en tu perfil.',
        '💊',
        '/perfil',
        receta._id,
        'Receta'
      );
    } catch (notifError) {
      console.error('Error notificando nueva receta al paciente:', notifError.message);
    }

    res.status(201).json(receta);
  } catch (error) {
    res.status(400).json({ message: 'Error creando la receta', error });
  }
};

exports.getRecetasPaciente = async (req, res) => {
  try {
    const recetas = await Receta.find({ paciente: req.params.pacienteId }).sort({ fechaEmision: -1 });
    res.json(recetas);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo recetas', error });
  }
};

exports.getRecetasFavoritas = async (req, res) => {
  try {
    const recetas = await Receta.find({ medico: req.user.id, esFavorita: true }).sort({ fechaEmision: -1 });
    res.json(recetas);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo recetas favoritas', error });
  }
};

exports.getMisRecetas = async (req, res) => {
  try {
    const recetas = await Receta.find({ paciente: req.user.id })
      .populate('medico', 'nombre especialidad')
      .sort({ fechaEmision: -1 });
    res.json(recetas);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo recetas del paciente', error });
  }
};
