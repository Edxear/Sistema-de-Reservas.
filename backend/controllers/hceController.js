const Problema = require('../models/Problema');
const Alergia = require('../models/Alergia');
const HistoriaClinica = require('../models/HistoriaClinica');

// ── Problemas clínicos ────────────────────────────────────────────────────────

exports.listarProblemas = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;
    const { estado } = req.query;
    const filtro = { paciente: pacienteId };
    if (estado) filtro.estado = estado;
    const problemas = await Problema.find(filtro)
      .populate('medico', 'nombre apellido')
      .sort({ estado: 1, fechaInicio: -1 });
    res.json({ ok: true, data: problemas });
  } catch (err) { next(err); }
};

exports.crearProblema = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;
    const problema = await Problema.create({ ...req.body, paciente: pacienteId, medico: req.user._id });
    res.status(201).json({ ok: true, data: problema });
  } catch (err) { next(err); }
};

exports.actualizarProblema = async (req, res, next) => {
  try {
    const problema = await Problema.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!problema) return res.status(404).json({ ok: false, message: 'Problema no encontrado' });
    res.json({ ok: true, data: problema });
  } catch (err) { next(err); }
};

exports.resolverProblema = async (req, res, next) => {
  try {
    const problema = await Problema.findByIdAndUpdate(
      req.params.id,
      { estado: 'resuelto', fechaResolucion: new Date() },
      { new: true }
    );
    if (!problema) return res.status(404).json({ ok: false, message: 'Problema no encontrado' });
    res.json({ ok: true, data: problema });
  } catch (err) { next(err); }
};

// ── Alergias ──────────────────────────────────────────────────────────────────

exports.listarAlergias = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;
    const alergias = await Alergia.find({ paciente: pacienteId })
      .populate('medico', 'nombre apellido')
      .sort({ gravedad: 1, tipo: 1 });
    res.json({ ok: true, data: alergias });
  } catch (err) { next(err); }
};

exports.crearAlergia = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;
    const alergia = await Alergia.create({ ...req.body, paciente: pacienteId, medico: req.user._id });
    res.status(201).json({ ok: true, data: alergia });
  } catch (err) { next(err); }
};

exports.actualizarAlergia = async (req, res, next) => {
  try {
    const alergia = await Alergia.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!alergia) return res.status(404).json({ ok: false, message: 'Alergia no encontrada' });
    res.json({ ok: true, data: alergia });
  } catch (err) { next(err); }
};

// ── Resumen clínico del paciente (para panel de HCE) ─────────────────────────

exports.resumenPaciente = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;

    const [problemas, alergias, ultimasEvoluciones] = await Promise.all([
      Problema.find({ paciente: pacienteId, estado: 'activo' }).sort({ fechaInicio: -1 }).limit(20),
      Alergia.find({ paciente: pacienteId, estado: 'activa' }).sort({ gravedad: 1 }),
      HistoriaClinica.find({ paciente: pacienteId })
        .populate('medico', 'nombre apellido')
        .sort({ fecha: -1 })
        .limit(10),
    ]);

    // Alertas rojas: alergias graves + problemas críticos
    const alertasRojas = [
      ...alergias.filter(a => ['grave', 'anafilaxia'].includes(a.gravedad)).map(a => ({
        tipo: 'alergia', gravedad: a.gravedad, descripcion: `${a.sustancia}: ${a.reaccion}`,
      })),
      ...problemas.filter(p => p.tipoProblema === 'cronico').map(p => ({
        tipo: 'problema', descripcion: p.descripcion,
      })),
    ];

    res.json({ ok: true, data: { problemas, alergias, ultimasEvoluciones, alertasRojas } });
  } catch (err) { next(err); }
};

// ── Timeline clínica ──────────────────────────────────────────────────────────

exports.timeline = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;
    const { limit = 30 } = req.query;
    const eventos = await HistoriaClinica.find({ paciente: pacienteId })
      .populate('medico', 'nombre apellido')
      .sort({ fecha: -1 })
      .limit(parseInt(limit))
      .select('fecha tipo eventCategory descripcion soap clinicalSnapshot flags medico');
    res.json({ ok: true, data: eventos });
  } catch (err) { next(err); }
};
