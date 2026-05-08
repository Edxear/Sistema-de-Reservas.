const mongoose = require('mongoose');

// Importar modelos necesarios para métricas
const HistoriaClinica = require('../models/HistoriaClinica');
const Booking = require('../models/Booking');
const Admision = require('../models/Admision');
const Factura = require('../models/Factura');
const Pago = require('../models/Pago');
const SolicitudLab = require('../models/SolicitudLab');
const SolicitudImagen = require('../models/SolicitudImagen');
const Notificacion = require('../models/Notificacion');

// Helper para rango de fechas
function rangoFechas(desde, hasta) {
  const filtro = {};
  if (desde) filtro.$gte = new Date(desde);
  if (hasta) { const h = new Date(hasta); h.setHours(23,59,59,999); filtro.$lte = h; }
  return Object.keys(filtro).length ? filtro : undefined;
}

// ── KPIs ejecutivos ───────────────────────────────────────────────────────────

exports.kpisEjecutivos = async (req, res, next) => {
  try {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const fin = new Date(); fin.setHours(23,59,59,999);

    const [
      admisionesHoy, altasHoy, internados,
      turnosHoy, turnosCancelados, turnosAtendidos,
      facturacionMes, cobradoMes,
      solicitudesLabHoy, solicitudesImagenHoy,
    ] = await Promise.all([
      Admision.countDocuments({ fechaIngreso: { $gte: hoy, $lte: fin } }),
      Admision.countDocuments({ fechaAlta: { $gte: hoy, $lte: fin } }),
      Admision.countDocuments({ estado: 'activa', tipoAdmision: 'internacion' }),
      Booking.countDocuments({ fecha: { $gte: hoy, $lte: fin } }),
      Booking.countDocuments({ fecha: { $gte: hoy, $lte: fin }, estado: 'cancelada' }),
      Booking.countDocuments({ fecha: { $gte: hoy, $lte: fin }, estado: 'atendida' }),
      Factura.aggregate([
        { $match: { fecha: { $gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1) }, estado: { $ne: 'anulada' } } },
        { $group: { _id: null, total: { $sum: '$montoTotal' } } },
      ]),
      Pago.aggregate([
        { $match: { fecha: { $gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1) }, estado: 'confirmado' } },
        { $group: { _id: null, total: { $sum: '$monto' } } },
      ]),
      SolicitudLab.countDocuments({ fechaSolicitud: { $gte: hoy, $lte: fin } }),
      SolicitudImagen.countDocuments({ fechaSolicitud: { $gte: hoy, $lte: fin } }),
    ]);

    res.json({
      ok: true,
      data: {
        admisiones: { hoy: admisionesHoy, altas: altasHoy, internados },
        turnos: { total: turnosHoy, cancelados: turnosCancelados, atendidos: turnosAtendidos },
        financiero: {
          facturacionMes: facturacionMes[0]?.total || 0,
          cobradoMes: cobradoMes[0]?.total || 0,
        },
        laboratorio: { solicitudesHoy: solicitudesLabHoy },
        imagenologia: { solicitudesHoy: solicitudesImagenHoy },
      },
    });
  } catch (err) { next(err); }
};

// ── Producción por médico ─────────────────────────────────────────────────────

exports.produccionMedicos = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filtroFecha = rangoFechas(desde, hasta);
    const matchFecha = filtroFecha ? { fecha: filtroFecha } : {};

    const produccion = await Booking.aggregate([
      { $match: { ...matchFecha, estado: 'atendida' } },
      { $group: { _id: '$medico', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'medico' } },
      { $unwind: '$medico' },
      { $project: { nombre: '$medico.nombre', apellido: '$medico.apellido', total: 1 } },
    ]);
    res.json({ ok: true, data: produccion });
  } catch (err) { next(err); }
};

// ── Ocupación de camas por período ────────────────────────────────────────────

exports.ocupacionCamas = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filtroFecha = rangoFechas(desde, hasta);
    const match = filtroFecha ? { fechaIngreso: filtroFecha } : {};

    const porServicio = await Admision.aggregate([
      { $match: { tipoAdmision: 'internacion', ...match } },
      { $group: { _id: '$servicio', ingresos: { $sum: 1 } } },
      { $sort: { ingresos: -1 } },
    ]);
    res.json({ ok: true, data: porServicio });
  } catch (err) { next(err); }
};

// ── Top 10 diagnósticos ───────────────────────────────────────────────────────

exports.topDiagnosticos = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filtroFecha = rangoFechas(desde, hasta);
    const match = { 'soap.codigoCie': { $ne: '' }, ...( filtroFecha ? { fecha: filtroFecha } : {} ) };

    const top = await HistoriaClinica.aggregate([
      { $match: match },
      { $group: { _id: '$soap.codigoCie', descripcion: { $first: '$soap.analisis' }, total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);
    res.json({ ok: true, data: top });
  } catch (err) { next(err); }
};

// ── Resumen de laboratorio ────────────────────────────────────────────────────

exports.resumenLaboratorio = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filtroFecha = rangoFechas(desde, hasta);
    const match = filtroFecha ? { fechaSolicitud: filtroFecha } : {};

    const porEstado = await SolicitudLab.aggregate([
      { $match: match },
      { $group: { _id: '$estado', total: { $sum: 1 } } },
    ]);
    res.json({ ok: true, data: porEstado });
  } catch (err) { next(err); }
};

// ── Indicadores financieros ───────────────────────────────────────────────────

exports.indicadoresFinancieros = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filtroFecha = rangoFechas(desde, hasta);
    const matchFact = filtroFecha ? { fecha: filtroFecha, estado: { $ne: 'anulada' } } : { estado: { $ne: 'anulada' } };
    const matchPago = filtroFecha ? { fecha: filtroFecha, estado: 'confirmado' } : { estado: 'confirmado' };

    const [facturas, pagos, porMedioPago] = await Promise.all([
      Factura.aggregate([{ $match: matchFact }, { $group: { _id: '$estado', total: { $sum: '$montoTotal' }, cantidad: { $sum: 1 } } }]),
      Pago.aggregate([{ $match: matchPago }, { $group: { _id: null, totalCobrado: { $sum: '$monto' } } }]),
      Pago.aggregate([{ $match: matchPago }, { $group: { _id: '$medioPago', total: { $sum: '$monto' } } }, { $sort: { total: -1 } }]),
    ]);
    res.json({ ok: true, data: { facturas, totalCobrado: pagos[0]?.totalCobrado || 0, porMedioPago } });
  } catch (err) { next(err); }
};
