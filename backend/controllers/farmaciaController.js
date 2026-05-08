const Medicamento = require('../models/Medicamento');
const LoteMedicamento = require('../models/LoteMedicamento');
const Dispensacion = require('../models/Dispensacion');
const InteraccionMedicamento = require('../models/InteraccionMedicamento');
const Alergia = require('../models/Alergia');

// ── Catálogo de medicamentos ──────────────────────────────────────────────────

exports.listarMedicamentos = async (req, res, next) => {
  try {
    const { q, formaFarmaceutica } = req.query;
    const filtro = { activo: true };
    if (q) filtro.$or = [
      { principioActivo: { $regex: q, $options: 'i' } },
      { nombreComercial: { $regex: q, $options: 'i' } },
      { codigo: { $regex: q, $options: 'i' } },
    ];
    if (formaFarmaceutica) filtro.formaFarmaceutica = formaFarmaceutica;
    const medicamentos = await Medicamento.find(filtro).sort({ principioActivo: 1 }).limit(50);
    res.json({ ok: true, data: medicamentos });
  } catch (err) { next(err); }
};

exports.crearMedicamento = async (req, res, next) => {
  try {
    const med = await Medicamento.create(req.body);
    res.status(201).json({ ok: true, data: med });
  } catch (err) { next(err); }
};

// ── Gestión de stock / lotes ──────────────────────────────────────────────────

exports.listarLotes = async (req, res, next) => {
  try {
    const { medicamento, soloConStock } = req.query;
    const filtro = { activo: true };
    if (medicamento) filtro.medicamento = medicamento;
    if (soloConStock === 'true') filtro.stockActual = { $gt: 0 };
    const lotes = await LoteMedicamento.find(filtro)
      .populate('medicamento', 'principioActivo concentracion formaFarmaceutica')
      .sort({ fechaVencimiento: 1 });
    res.json({ ok: true, data: lotes });
  } catch (err) { next(err); }
};

exports.ingresarLote = async (req, res, next) => {
  try {
    const { medicamento, numeroLote, fechaVencimiento, stockInicial, ubicacion, proveedorFactura } = req.body;
    const lote = await LoteMedicamento.create({
      medicamento, numeroLote, fechaVencimiento,
      stockInicial, stockActual: stockInicial,
      ubicacion, proveedorFactura,
    });
    res.status(201).json({ ok: true, data: lote });
  } catch (err) { next(err); }
};

exports.stockTotal = async (req, res, next) => {
  try {
    const { medicamento } = req.params;
    const lotes = await LoteMedicamento.find({ medicamento, activo: true, stockActual: { $gt: 0 } });
    const total = lotes.reduce((s, l) => s + l.stockActual, 0);
    const vencimientoProximo = lotes
      .filter(l => new Date(l.fechaVencimiento) <= new Date(Date.now() + 90 * 24 * 3600 * 1000))
      .map(l => ({ lote: l.numeroLote, vence: l.fechaVencimiento, stock: l.stockActual }));
    res.json({ ok: true, data: { total, lotes: lotes.length, vencimientoProximo } });
  } catch (err) { next(err); }
};

// ── Dispensación ──────────────────────────────────────────────────────────────

exports.dispensar = async (req, res, next) => {
  try {
    const {
      receta, paciente, medicamento, loteId,
      cantidadDispensada, dosis, frecuencia, duracionDias, entregadoA, observaciones,
    } = req.body;

    // Verificar alergias del paciente
    const alertasAlergia = [];
    const med = await Medicamento.findById(medicamento);
    if (med) {
      const alergias = await Alergia.find({ paciente, estado: 'activa', tipo: 'medicamentosa' }).select('sustancia');
      const nombresAlergia = alergias.map(a => a.sustancia.toLowerCase());
      const alertasAlergiasMed = (med.alertasAlergias || []).filter(a => nombresAlergia.includes(a.toLowerCase()));
      if (alertasAlergiasMed.length > 0) alertasAlergia.push(...alertasAlergiasMed);
    }

    // Descontar stock del lote
    const lote = await LoteMedicamento.findById(loteId);
    if (!lote) return res.status(404).json({ ok: false, message: 'Lote no encontrado' });
    if (lote.stockActual < cantidadDispensada) {
      return res.status(400).json({ ok: false, message: 'Stock insuficiente en el lote seleccionado' });
    }
    lote.stockActual -= cantidadDispensada;
    await lote.save();

    const dispensacion = await Dispensacion.create({
      receta, paciente, medicamento, lote: loteId,
      cantidadDispensada, dosis, frecuencia, duracionDias,
      farmaceutico: req.user._id, entregadoA, observaciones,
      validaciones: { sinAlergias: alertasAlergia.length === 0, validadoPor: req.user._id },
    });

    res.status(201).json({ ok: true, data: dispensacion, alertasAlergia });
  } catch (err) { next(err); }
};

exports.historialDispensaciones = async (req, res, next) => {
  try {
    const { id } = req.params;
    const disp = await Dispensacion.find({ paciente: id })
      .populate('medicamento', 'principioActivo concentracion formaFarmaceutica')
      .populate('farmaceutico', 'nombre apellido')
      .sort({ fechaDispensacion: -1 })
      .limit(50);
    res.json({ ok: true, data: disp });
  } catch (err) { next(err); }
};

// ── Interacciones ─────────────────────────────────────────────────────────────

exports.verificarInteracciones = async (req, res, next) => {
  try {
    const { medicamentos } = req.body; // array de IDs
    if (!medicamentos || medicamentos.length < 2) return res.json({ ok: true, data: [] });
    const interacciones = await InteraccionMedicamento.find({
      $or: [
        { medicamentoA: { $in: medicamentos }, medicamentoB: { $in: medicamentos } },
      ],
      activo: true,
    }).populate('medicamentoA', 'principioActivo').populate('medicamentoB', 'principioActivo');
    res.json({ ok: true, data: interacciones });
  } catch (err) { next(err); }
};

// ── Alertas de stock ──────────────────────────────────────────────────────────

exports.alertasVencimiento = async (req, res, next) => {
  try {
    const diasUmbral = parseInt(req.query.dias || '90');
    const limite = new Date(Date.now() + diasUmbral * 24 * 3600 * 1000);
    const lotes = await LoteMedicamento.find({ activo: true, stockActual: { $gt: 0 }, fechaVencimiento: { $lte: limite } })
      .populate('medicamento', 'principioActivo nombreComercial concentracion')
      .sort({ fechaVencimiento: 1 });
    res.json({ ok: true, data: lotes });
  } catch (err) { next(err); }
};
