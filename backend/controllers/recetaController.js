const Receta = require('../models/Receta');

exports.crearReceta = async (req, res) => {
  try {
    const receta = new Receta({
      ...req.body,
      medico: req.user.id
    });
    await receta.save();
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
