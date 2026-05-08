const ListaEspera = require('../models/ListaEspera');

exports.agregar = async (req, res, next) => {
  try {
    const { medico, servicio, prioridad, motivoConsulta, preferencias } = req.body;
    // Evitar duplicados activos para el mismo paciente/médico
    const existe = await ListaEspera.findOne({ paciente: req.body.paciente || req.user._id, medico, estado: 'en_espera' });
    if (existe) return res.status(409).json({ ok: false, message: 'Ya existe una entrada activa en lista de espera para este médico' });

    const entrada = await ListaEspera.create({
      paciente: req.body.paciente || req.user._id,
      medico, servicio: servicio || null,
      prioridad, motivoConsulta, preferencias,
    });
    res.status(201).json({ ok: true, data: entrada });
  } catch (err) { next(err); }
};

exports.listarPorMedico = async (req, res, next) => {
  try {
    const { medico } = req.params;
    const lista = await ListaEspera.find({ medico, estado: 'en_espera' })
      .populate('paciente', 'nombre apellido email')
      .sort({ prioridad: 1, fechaSolicitud: 1 });
    res.json({ ok: true, data: lista });
  } catch (err) { next(err); }
};

exports.asignarTurno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { turnoAsignado } = req.body;
    const entrada = await ListaEspera.findByIdAndUpdate(
      id,
      { estado: 'asignado', turnoAsignado, fechaAsignacion: new Date() },
      { new: true }
    );
    if (!entrada) return res.status(404).json({ ok: false, message: 'Entrada no encontrada' });
    res.json({ ok: true, data: entrada });
  } catch (err) { next(err); }
};

exports.cancelar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entrada = await ListaEspera.findByIdAndUpdate(id, { estado: 'cancelado' }, { new: true });
    if (!entrada) return res.status(404).json({ ok: false, message: 'Entrada no encontrada' });
    res.json({ ok: true, data: entrada });
  } catch (err) { next(err); }
};
