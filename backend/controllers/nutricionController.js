const Nutricion = require('../models/Nutricion');

exports.crearNutricion = async (req, res) => {
  try {
    const { paciente, dieta, fechaInicio, fechaFin } = req.body;

    if (!paciente || !dieta || !fechaInicio) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const nutricion = await Nutricion.create({
      paciente,
      dieta,
      fechaInicio,
      fechaFin,
      estado: 'activa',
    });

    res.status(201).json(nutricion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerNutriciones = async (req, res) => {
  try {
    const nutricionesActivas = await Nutricion.find({ estado: 'activa' })
      .populate('paciente', 'nombre email');

    res.json(nutricionesActivas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarNutricion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fechaFin } = req.body;

    const nutricion = await Nutricion.findByIdAndUpdate(
      id,
      { estado, fechaFin },
      { new: true }
    );

    res.json(nutricion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerMetricas = async (req, res) => {
  try {
    const totalActivas = await Nutricion.countDocuments({ estado: 'activa' });
    const totalSuspendidas = await Nutricion.countDocuments({ estado: 'suspendida' });
    const totalFinalizadas = await Nutricion.countDocuments({ estado: 'finalizada' });

    res.json({
      totalActivas,
      totalSuspendidas,
      totalFinalizadas,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
