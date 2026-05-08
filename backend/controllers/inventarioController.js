const Insumo = require('../models/Insumo');
const MovimientoStock = require('../models/MovimientoStock');
const Equipo = require('../models/Equipo');
const Mantenimiento = require('../models/Mantenimiento');

// ── Insumos ───────────────────────────────────────────────────────────────────

exports.listarInsumos = async (req, res, next) => {
  try {
    const { categoria, stockBajo, q } = req.query;
    const filtro = { activo: true };
    if (categoria) filtro.categoria = categoria;
    if (stockBajo === 'true') filtro.$expr = { $lte: ['$stockActual', '$stockMinimo'] };
    if (q) filtro.$or = [
      { nombre: { $regex: q, $options: 'i' } },
      { codigo: { $regex: q, $options: 'i' } },
    ];
    const insumos = await Insumo.find(filtro).sort({ nombre: 1 });
    res.json({ ok: true, data: insumos });
  } catch (err) { next(err); }
};

exports.crearInsumo = async (req, res, next) => {
  try {
    const insumo = await Insumo.create(req.body);
    res.status(201).json({ ok: true, data: insumo });
  } catch (err) { next(err); }
};

exports.actualizarInsumo = async (req, res, next) => {
  try {
    const insumo = await Insumo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!insumo) return res.status(404).json({ ok: false, message: 'Insumo no encontrado' });
    res.json({ ok: true, data: insumo });
  } catch (err) { next(err); }
};

// ── Movimientos de stock ──────────────────────────────────────────────────────

exports.registrarMovimiento = async (req, res, next) => {
  try {
    const { insumo: insumoId, tipo, cantidad, servicioDestino, lote, fechaVencimientoLote, paciente, admision, motivoAjuste, ordenCompra } = req.body;

    const insumoDoc = await Insumo.findById(insumoId);
    if (!insumoDoc) return res.status(404).json({ ok: false, message: 'Insumo no encontrado' });

    // Calcular nuevo stock
    const esEntrada = ['entrada', 'ajuste_positivo', 'devolucion'].includes(tipo);
    if (!esEntrada && insumoDoc.stockActual < cantidad) {
      return res.status(400).json({ ok: false, message: 'Stock insuficiente para esta operación' });
    }
    const stockResultante = esEntrada ? insumoDoc.stockActual + cantidad : insumoDoc.stockActual - cantidad;

    // Actualizar stock del insumo
    insumoDoc.stockActual = stockResultante;
    await insumoDoc.save();

    // Registrar movimiento
    const movimiento = await MovimientoStock.create({
      insumo: insumoId, tipo, cantidad, stockResultante,
      usuario: req.user._id, servicioDestino, lote, fechaVencimientoLote,
      paciente: paciente || null, admision: admision || null,
      motivoAjuste, ordenCompra,
    });

    // Alerta si queda en mínimo
    const alertaStockBajo = stockResultante <= insumoDoc.stockMinimo;

    res.status(201).json({ ok: true, data: movimiento, alertaStockBajo, stockActual: stockResultante });
  } catch (err) { next(err); }
};

exports.kardex = async (req, res, next) => {
  try {
    const { insumoId } = req.params;
    const { desde, hasta } = req.query;
    const filtro = { insumo: insumoId };
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }
    const movimientos = await MovimientoStock.find(filtro)
      .populate('usuario', 'nombre apellido')
      .sort({ fecha: -1 })
      .limit(200);
    res.json({ ok: true, data: movimientos });
  } catch (err) { next(err); }
};

// ── Equipos ───────────────────────────────────────────────────────────────────

exports.listarEquipos = async (req, res, next) => {
  try {
    const { servicio, estado, tipo } = req.query;
    const filtro = { activo: true };
    if (servicio) filtro.servicio = servicio;
    if (estado) filtro.estado = estado;
    if (tipo) filtro.tipo = tipo;
    const equipos = await Equipo.find(filtro).sort({ nombre: 1 });
    res.json({ ok: true, data: equipos });
  } catch (err) { next(err); }
};

exports.crearEquipo = async (req, res, next) => {
  try {
    const equipo = await Equipo.create(req.body);
    res.status(201).json({ ok: true, data: equipo });
  } catch (err) { next(err); }
};

exports.actualizarEquipo = async (req, res, next) => {
  try {
    const equipo = await Equipo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!equipo) return res.status(404).json({ ok: false, message: 'Equipo no encontrado' });
    res.json({ ok: true, data: equipo });
  } catch (err) { next(err); }
};

// ── Mantenimientos ────────────────────────────────────────────────────────────

exports.listarMantenimientos = async (req, res, next) => {
  try {
    const { equipo, estado, tipo } = req.query;
    const filtro = {};
    if (equipo) filtro.equipo = equipo;
    if (estado) filtro.estado = estado;
    if (tipo) filtro.tipo = tipo;
    const mantenimientos = await Mantenimiento.find(filtro)
      .populate('equipo', 'nombre marca modelo servicio')
      .populate('tecnico', 'nombre apellido')
      .sort({ fechaProgramada: 1 });
    res.json({ ok: true, data: mantenimientos });
  } catch (err) { next(err); }
};

exports.crearMantenimiento = async (req, res, next) => {
  try {
    const mant = await Mantenimiento.create({ ...req.body });
    // Actualizar estado del equipo
    const estadoEquipo = req.body.tipo === 'correctivo' ? 'en_reparacion' : 'mantenimiento_preventivo';
    await Equipo.findByIdAndUpdate(req.body.equipo, { estado: estadoEquipo });
    res.status(201).json({ ok: true, data: mant });
  } catch (err) { next(err); }
};

exports.completarMantenimiento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accionesRealizadas, repuestosUsados, costo, equipoDevuelto, observaciones } = req.body;
    const mant = await Mantenimiento.findByIdAndUpdate(
      id,
      {
        estado: 'completado', fechaFinalizacion: new Date(),
        accionesRealizadas, repuestosUsados, costo, equipoDevuelto,
        fechaDevolucion: equipoDevuelto ? new Date() : undefined,
        observaciones,
      },
      { new: true }
    ).populate('equipo');
    if (!mant) return res.status(404).json({ ok: false, message: 'Mantenimiento no encontrado' });

    // Restaurar estado del equipo si se devolvió
    if (equipoDevuelto) {
      const siguienteMant = new Date();
      siguienteMant.setMonth(siguienteMant.getMonth() + (mant.equipo.frecuenciaMantenimientoMeses || 6));
      await Equipo.findByIdAndUpdate(mant.equipo._id, { estado: 'operativo', proximoMantenimiento: siguienteMant });
    }

    res.json({ ok: true, data: mant });
  } catch (err) { next(err); }
};

exports.equiposPorVencer = async (req, res, next) => {
  try {
    const diasUmbral = parseInt(req.query.dias || '30');
    const limite = new Date(Date.now() + diasUmbral * 24 * 3600 * 1000);
    const equipos = await Equipo.find({ activo: true, proximoMantenimiento: { $lte: limite }, estado: 'operativo' })
      .sort({ proximoMantenimiento: 1 });
    res.json({ ok: true, data: equipos });
  } catch (err) { next(err); }
};
