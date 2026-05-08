const EpisodioUCI = require('../models/EpisodioUCI');
const ConstanteVital = require('../models/ConstanteVital');
const BalanceHidrico = require('../models/BalanceHidrico');
const EscalaClinica = require('../models/EscalaClinica');
const Notificacion = require('../models/Notificacion');

// ── Episodios UCI ─────────────────────────────────────────────────────────────

exports.crearEpisodio = async (req, res, next) => {
  try {
    const episodio = await EpisodioUCI.create({
      ...req.body,
      medicoResponsable: req.user._id,
    });
    res.status(201).json({ ok: true, data: episodio });
  } catch (err) { next(err); }
};

exports.listarActivos = async (req, res, next) => {
  try {
    const episodios = await EpisodioUCI.find({ estado: 'activo' })
      .populate('paciente', 'nombre apellido')
      .populate('cama', 'numero habitacion servicio')
      .populate('medicoResponsable', 'nombre apellido')
      .sort({ fechaIngreso: -1 });
    res.json({ ok: true, data: episodios });
  } catch (err) { next(err); }
};

exports.obtenerEpisodio = async (req, res, next) => {
  try {
    const ep = await EpisodioUCI.findById(req.params.id)
      .populate('paciente', 'nombre apellido')
      .populate('cama', 'numero habitacion')
      .populate('medicoResponsable', 'nombre apellido');
    if (!ep) return res.status(404).json({ ok: false, message: 'Episodio no encontrado' });
    res.json({ ok: true, data: ep });
  } catch (err) { next(err); }
};

exports.egresarPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado = 'egresado', observaciones } = req.body;
    const ep = await EpisodioUCI.findByIdAndUpdate(
      id,
      { estado, fechaEgreso: new Date(), observaciones },
      { new: true }
    );
    if (!ep) return res.status(404).json({ ok: false, message: 'Episodio no encontrado' });
    res.json({ ok: true, data: ep });
  } catch (err) { next(err); }
};

// ── Constantes vitales ────────────────────────────────────────────────────────

// Calcular MEWS score (0-14) basado en parámetros
function calcularMews({ fc, pas, fr, temperatura, spo2 }) {
  let score = 0;
  if (fc !== undefined) {
    if (fc < 40 || fc > 130) score += 3;
    else if (fc < 50 || fc > 110) score += 2;
    else if (fc < 60 || fc > 100) score += 1;
  }
  if (pas !== undefined) {
    if (pas < 70) score += 3;
    else if (pas < 80) score += 2;
    else if (pas < 100 || pas > 200) score += 1;
  }
  if (fr !== undefined) {
    if (fr < 9 || fr > 29) score += 2;
    else if (fr > 20) score += 1;
  }
  if (temperatura !== undefined) {
    if (temperatura < 35 || temperatura > 39) score += 2;
  }
  return score;
}

exports.registrarConstantes = async (req, res, next) => {
  try {
    const { episodioUCI, paciente, fc, pas, pad, pam, spo2, fr, temperatura, fio2, peep, volumenCorriente, notas } = req.body;

    const mewsScore = calcularMews({ fc, pas, fr, temperatura, spo2 });
    const alertaMews = mewsScore >= 5;

    const constante = await ConstanteVital.create({
      episodioUCI, paciente,
      fc, pas, pad, pam, spo2, fr, temperatura,
      fio2, peep, volumenCorriente,
      mewsScore, alertaMews,
      registradoPor: req.user._id,
      notas,
    });

    // Alerta si MEWS >= 5
    if (alertaMews) {
      const ep = await EpisodioUCI.findById(episodioUCI).select('medicoResponsable');
      if (ep) {
        await Notificacion.create({
          usuario: ep.medicoResponsable,
          tipo: 'alerta_clinica',
          titulo: '🔴 Alerta MEWS elevado',
          mensaje: `MEWS Score = ${mewsScore} en paciente UCI. Requiere evaluación inmediata.`,
          prioridad: 'alta',
          metadata: { referenciaId: String(episodioUCI), modulo: 'uci' },
        });
      }
    }

    res.status(201).json({ ok: true, data: constante, mewsScore, alertaMews });
  } catch (err) { next(err); }
};

exports.historialConstantes = async (req, res, next) => {
  try {
    const { episodioId } = req.params;
    const { limite = 50 } = req.query;
    const constantes = await ConstanteVital.find({ episodioUCI: episodioId })
      .sort({ fechaHora: -1 })
      .limit(parseInt(limite));
    res.json({ ok: true, data: constantes });
  } catch (err) { next(err); }
};

// ── Balance hídrico ───────────────────────────────────────────────────────────

exports.registrarBalance = async (req, res, next) => {
  try {
    const balance = await BalanceHidrico.create({ ...req.body, registradoPor: req.user._id });
    res.status(201).json({ ok: true, data: balance });
  } catch (err) { next(err); }
};

exports.resumenBalance = async (req, res, next) => {
  try {
    const { episodioId } = req.params;
    const { fecha } = req.query;
    const filtro = { episodioUCI: episodioId };
    if (fecha) {
      const d = new Date(fecha); d.setHours(0,0,0,0);
      const h = new Date(fecha); h.setHours(23,59,59,999);
      filtro.fechaHora = { $gte: d, $lte: h };
    }
    const registros = await BalanceHidrico.find(filtro).sort({ fechaHora: 1 });
    const ingresos = registros.filter(r => r.tipoRegistro === 'ingreso').reduce((s, r) => s + r.volumenMl, 0);
    const egresos = registros.filter(r => r.tipoRegistro === 'egreso').reduce((s, r) => s + r.volumenMl, 0);
    res.json({ ok: true, data: { ingresos, egresos, balance: ingresos - egresos, registros } });
  } catch (err) { next(err); }
};

// ── Escalas clínicas ──────────────────────────────────────────────────────────

exports.registrarEscala = async (req, res, next) => {
  try {
    const escala = await EscalaClinica.create({ ...req.body, evaluadoPor: req.user._id });
    res.status(201).json({ ok: true, data: escala });
  } catch (err) { next(err); }
};

exports.historialEscalas = async (req, res, next) => {
  try {
    const { episodioId } = req.params;
    const { tipoEscala } = req.query;
    const filtro = { episodioUCI: episodioId };
    if (tipoEscala) filtro.tipoEscala = tipoEscala;
    const escalas = await EscalaClinica.find(filtro)
      .populate('evaluadoPor', 'nombre apellido')
      .sort({ fechaEvaluacion: -1 });
    res.json({ ok: true, data: escalas });
  } catch (err) { next(err); }
};

// ── Dashboard UCI ─────────────────────────────────────────────────────────────

exports.dashboardUCI = async (req, res, next) => {
  try {
    const activos = await EpisodioUCI.find({ estado: 'activo' })
      .populate('paciente', 'nombre apellido')
      .populate('cama', 'numero habitacion');

    // Última constante vital de cada episodio
    const dashData = await Promise.all(activos.map(async ep => {
      const ultima = await ConstanteVital.findOne({ episodioUCI: ep._id }).sort({ fechaHora: -1 });
      return { episodio: ep, ultimaConstante: ultima };
    }));

    res.json({ ok: true, data: dashData });
  } catch (err) { next(err); }
};
