const Admision = require('../models/Admision');
const BedUnit = require('../models/BedUnit');

// ── Admisiones ────────────────────────────────────────────────────────────────

exports.crearAdmision = async (req, res, next) => {
  try {
    const {
      paciente, tipoAdmision, servicio, medicoTratante, motivoIngreso,
      diagnosticoIngreso, cobertura, contactoEmergencia, triaje, cama,
    } = req.body;

    const admision = await Admision.create({
      paciente, tipoAdmision, servicio, medicoTratante,
      motivoIngreso, diagnosticoIngreso, cobertura,
      contactoEmergencia, triaje, cama: cama || null,
      registradoPor: req.user._id,
    });

    // Marcar la cama como ocupada si se asignó una
    if (cama) {
      await BedUnit.findByIdAndUpdate(cama, { estado: 'occupied' });
    }

    res.status(201).json({ ok: true, data: admision });
  } catch (err) { next(err); }
};

exports.buscarPaciente = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ ok: true, data: [] });
    const pacientes = await User.find({
      role: 'patient',
      $or: [
        { nombre: { $regex: q, $options: 'i' } },
        { apellido: { $regex: q, $options: 'i' } },
        { documento: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    }).select('nombre apellido email documento fechaNacimiento').limit(10);
    res.json({ ok: true, data: pacientes });
  } catch (err) { next(err); }
};

exports.obtenerAdmision = async (req, res, next) => {
  try {
    const admision = await Admision.findById(req.params.id)
      .populate('paciente', 'nombre apellido email documento')
      .populate('medicoTratante', 'nombre apellido')
      .populate('cama', 'numero habitacion servicio')
      .populate('registradoPor', 'nombre');
    if (!admision) return res.status(404).json({ ok: false, message: 'Admisión no encontrada' });
    res.json({ ok: true, data: admision });
  } catch (err) { next(err); }
};

exports.listarAdmisiones = async (req, res, next) => {
  try {
    const { estado, tipoAdmision, servicio, fecha } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (tipoAdmision) filtro.tipoAdmision = tipoAdmision;
    if (servicio) filtro.servicio = servicio;
    if (fecha) {
      const d = new Date(fecha); d.setHours(0,0,0,0);
      const h = new Date(fecha); h.setHours(23,59,59,999);
      filtro.fechaIngreso = { $gte: d, $lte: h };
    }
    const admisiones = await Admision.find(filtro)
      .populate('paciente', 'nombre apellido documento')
      .populate('cama', 'numero habitacion')
      .sort({ fechaIngreso: -1 })
      .limit(100);
    res.json({ ok: true, data: admisiones });
  } catch (err) { next(err); }
};

exports.darAlta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { diagnosticoEgreso, observaciones } = req.body;
    const admision = await Admision.findById(id);
    if (!admision) return res.status(404).json({ ok: false, message: 'Admisión no encontrada' });

    admision.estado = 'alta';
    admision.fechaAlta = new Date();
    admision.diagnosticoEgreso = diagnosticoEgreso || '';
    admision.observaciones = observaciones || '';
    await admision.save();

    // Liberar cama
    if (admision.cama) {
      await BedUnit.findByIdAndUpdate(admision.cama, { estado: 'available' });
    }

    res.json({ ok: true, data: admision });
  } catch (err) { next(err); }
};

exports.generarPulsera = async (req, res, next) => {
  try {
    const { id } = req.params;
    const qrCode = `ADMISION-${id}-${Date.now()}`;
    const admision = await Admision.findByIdAndUpdate(
      id,
      { 'pulsera.generada': true, 'pulsera.codigoQr': qrCode, 'pulsera.fechaImpresion': new Date() },
      { new: true }
    );
    if (!admision) return res.status(404).json({ ok: false, message: 'Admisión no encontrada' });
    res.json({ ok: true, data: { codigoQr: qrCode } });
  } catch (err) { next(err); }
};

exports.ocupacionActual = async (req, res, next) => {
  try {
    const activas = await Admision.countDocuments({ estado: 'activa' });
    const internacion = await Admision.countDocuments({ estado: 'activa', tipoAdmision: 'internacion' });
    const urgencias = await Admision.countDocuments({ estado: 'activa', tipoAdmision: 'urgencia' });
    const porServicio = await Admision.aggregate([
      { $match: { estado: 'activa' } },
      { $group: { _id: '$servicio', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json({ ok: true, data: { total: activas, internacion, urgencias, porServicio } });
  } catch (err) { next(err); }
};
