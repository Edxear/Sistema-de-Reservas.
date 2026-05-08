const Prestacion = require('../models/Prestacion');
const Cargo = require('../models/Cargo');
const Factura = require('../models/Factura');
const Pago = require('../models/Pago');

// ── Prestaciones ──────────────────────────────────────────────────────────────

exports.listarPrestaciones = async (req, res, next) => {
  try {
    const { categoria } = req.query;
    const filtro = { activo: true };
    if (categoria) filtro.categoria = categoria;
    const prestaciones = await Prestacion.find(filtro).sort({ categoria: 1, nombre: 1 });
    res.json({ ok: true, data: prestaciones });
  } catch (err) { next(err); }
};

exports.crearPrestacion = async (req, res, next) => {
  try {
    const p = await Prestacion.create(req.body);
    res.status(201).json({ ok: true, data: p });
  } catch (err) { next(err); }
};

// ── Cargos ────────────────────────────────────────────────────────────────────

exports.crearCargo = async (req, res, next) => {
  try {
    const { paciente, prestacion, cantidad = 1, origen, cobertura, notas } = req.body;
    const prest = await Prestacion.findById(prestacion);
    if (!prest) return res.status(404).json({ ok: false, message: 'Prestación no encontrada' });

    const precioUnitario = prest.arancelBase;
    const descuento = cobertura?.porcentajeCubierto ? (precioUnitario * cantidad * cobertura.porcentajeCubierto / 100) : 0;
    const total = precioUnitario * cantidad - descuento;

    const cargo = await Cargo.create({
      paciente, prestacion, cantidad, precioUnitario, descuento, total,
      origen: origen || { tipo: 'manual' },
      cobertura: cobertura || {},
      notas,
    });
    res.status(201).json({ ok: true, data: cargo });
  } catch (err) { next(err); }
};

exports.listarCargosPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.query;
    const filtro = { paciente: id };
    if (estado) filtro.estado = estado;
    const cargos = await Cargo.find(filtro)
      .populate('prestacion', 'nombre categoria arancelBase')
      .sort({ fecha: -1 });
    res.json({ ok: true, data: cargos });
  } catch (err) { next(err); }
};

// ── Facturación ───────────────────────────────────────────────────────────────

exports.generarFactura = async (req, res, next) => {
  try {
    const { paciente, cargosIds, responsablePago, tipoFactura, observaciones } = req.body;

    // Calcular totales desde los cargos
    const cargos = await Cargo.find({ _id: { $in: cargosIds }, estado: 'pendiente' });
    if (cargos.length === 0) return res.status(400).json({ ok: false, message: 'No hay cargos pendientes seleccionados' });

    const subtotal = cargos.reduce((s, c) => s + c.precioUnitario * c.cantidad, 0);
    const descuentoTotal = cargos.reduce((s, c) => s + c.descuento, 0);
    const montoTotal = subtotal - descuentoTotal;

    // Generar número de factura (simplificado)
    const numero = `F-${Date.now()}`;

    const factura = await Factura.create({
      paciente, cargos: cargosIds, subtotal, descuentoTotal, montoTotal,
      numero, tipoFactura: tipoFactura || 'B',
      responsablePago: responsablePago || {},
      generadoPor: req.user._id, observaciones, estado: 'emitida',
    });

    // Marcar cargos como facturados
    await Cargo.updateMany({ _id: { $in: cargosIds } }, { estado: 'facturado', factura: factura._id });

    res.status(201).json({ ok: true, data: factura });
  } catch (err) { next(err); }
};

exports.listarFacturasPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facturas = await Factura.find({ paciente: id })
      .populate('cargos')
      .sort({ fecha: -1 });
    res.json({ ok: true, data: facturas });
  } catch (err) { next(err); }
};

exports.obtenerFactura = async (req, res, next) => {
  try {
    const factura = await Factura.findById(req.params.id)
      .populate({ path: 'cargos', populate: { path: 'prestacion', select: 'nombre categoria' } })
      .populate('paciente', 'nombre apellido')
      .populate('generadoPor', 'nombre');
    if (!factura) return res.status(404).json({ ok: false, message: 'Factura no encontrada' });
    res.json({ ok: true, data: factura });
  } catch (err) { next(err); }
};

// ── Pagos ─────────────────────────────────────────────────────────────────────

exports.registrarPago = async (req, res, next) => {
  try {
    const { facturaId, monto, medioPago, referencia, observaciones } = req.body;
    const factura = await Factura.findById(facturaId);
    if (!factura) return res.status(404).json({ ok: false, message: 'Factura no encontrada' });

    const pago = await Pago.create({
      factura: facturaId, paciente: factura.paciente,
      monto, medioPago, referencia, observaciones,
      estado: 'confirmado', procesadoPor: req.user._id,
    });

    // Verificar si la factura quedó saldada
    const totalPagado = await Pago.aggregate([
      { $match: { factura: factura._id, estado: 'confirmado' } },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ]);
    if (totalPagado[0]?.total >= factura.montoTotal) {
      await Factura.findByIdAndUpdate(facturaId, { estado: 'cobrada' });
    }

    res.status(201).json({ ok: true, data: pago });
  } catch (err) { next(err); }
};

// ── Reporte de morosidad ──────────────────────────────────────────────────────

exports.reporteMorosidad = async (req, res, next) => {
  try {
    const diasUmbral = parseInt(req.query.dias || '30');
    const limite = new Date(Date.now() - diasUmbral * 24 * 3600 * 1000);
    const facturas = await Factura.find({ estado: 'emitida', fecha: { $lte: limite } })
      .populate('paciente', 'nombre apellido email')
      .sort({ montoTotal: -1 });
    res.json({ ok: true, data: facturas, total: facturas.length });
  } catch (err) { next(err); }
};
