const HistoriaClinica = require('../models/HistoriaClinica');

exports.getPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const registros = await HistoriaClinica.find({ paciente: pacienteId })
      .populate('medico', 'nombre rol')
      .sort({ fecha: -1 });

    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo historia clínica', error });
  }
};

exports.crearRegistro = async (req, res) => {
  try {
    const registro = new HistoriaClinica({
      ...req.body,
      medico: req.user.id
    });
    await registro.save();
    res.status(201).json(registro);
  } catch (error) {
    res.status(400).json({ message: 'Error creando registro', error });
  }
};
