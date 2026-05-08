const PracticaLab = require('../models/PracticaLab');
const SolicitudLab = require('../models/SolicitudLab');
const ResultadoLab = require('../models/ResultadoLab');
const Notificacion = require('../models/Notificacion');

// ── Catálogo de prácticas ──────────────────────────────────────────────────────

exports.listarPracticas = async (req, res, next) => {
  try {
    const { categoria, activo = 'true' } = req.query;
    const filtro = { activo: activo === 'true' };
    if (categoria) filtro.categoria = categoria;
    const practicas = await PracticaLab.find(filtro).sort({ categoria: 1, nombre: 1 });
    res.json({ ok: true, data: practicas });
  } catch (err) { next(err); }
};

exports.crearPractica = async (req, res, next) => {
  try {
    const practica = await PracticaLab.create(req.body);
    res.status(201).json({ ok: true, data: practica });
  } catch (err) { next(err); }
};

exports.actualizarPractica = async (req, res, next) => {
  try {
    const practica = await PracticaLab.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!practica) return res.status(404).json({ ok: false, message: 'Práctica no encontrada' });
    res.json({ ok: true, data: practica });
  } catch (err) { next(err); }
};

// ── Solicitudes de laboratorio ─────────────────────────────────────────────────

exports.crearSolicitud = async (req, res, next) => {
  try {
    const { paciente, practicas, prioridad, diagnosticoPresuntivo, observaciones, ordenMedica } = req.body;
    const solicitud = await SolicitudLab.create({
      paciente,
      medico: req.user._id,
      practicas,
      prioridad,
      diagnosticoPresuntivo,
      observaciones,
      ordenMedica: ordenMedica || null,
    });
    res.status(201).json({ ok: true, data: solicitud });
  } catch (err) { next(err); }
};

exports.listarSolicitudesPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const solicitudes = await SolicitudLab.find({ paciente: id })
      .populate('practicas', 'nombre codigo unidadMedida')
      .populate('medico', 'nombre apellido')
      .sort({ fechaSolicitud: -1 })
      .limit(50);
    res.json({ ok: true, data: solicitudes });
  } catch (err) { next(err); }
};

exports.actualizarMuestra = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tipo, tubo, codigoBarras, tecnicoExtraccion } = req.body;
    const solicitud = await SolicitudLab.findByIdAndUpdate(
      id,
      {
        'muestra.tipo': tipo,
        'muestra.tubo': tubo,
        'muestra.codigoBarras': codigoBarras,
        'muestra.estadoMuestra': 'tomada',
        'muestra.fechaExtraccion': new Date(),
        'muestra.tecnicoExtraccion': tecnicoExtraccion || req.user._id,
        estado: 'en_proceso',
      },
      { new: true }
    );
    if (!solicitud) return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    res.json({ ok: true, data: solicitud });
  } catch (err) { next(err); }
};

// ── Resultados de laboratorio ─────────────────────────────────────────────────

exports.cargarResultado = async (req, res, next) => {
  try {
    const { solicitudId, practicaId, valorNumerico, valorTexto, unidad, observaciones } = req.body;

    // Obtener la práctica para evaluar valores críticos
    const PracticaLab = require('../models/PracticaLab');
    const practica = await PracticaLab.findById(practicaId);

    // Determinar interpretación automática
    let interpretacion = 'normal';
    let esCritico = false;
    if (practica && valorNumerico !== undefined) {
      if (valorNumerico < practica.valorCriticoMin) { interpretacion = 'critico_bajo'; esCritico = true; }
      else if (valorNumerico > practica.valorCriticoMax) { interpretacion = 'critico_alto'; esCritico = true; }
      else if (valorNumerico < practica.rangoNormalMin) interpretacion = 'bajo';
      else if (valorNumerico > practica.rangoNormalMax) interpretacion = 'alto';
    }

    const resultado = await ResultadoLab.create({
      solicitud: solicitudId,
      paciente: req.body.pacienteId,
      practica: practicaId,
      valorNumerico,
      valorTexto,
      unidad,
      interpretacion,
      esCritico,
      tecnico: req.user._id,
      observaciones,
    });

    // Si es crítico, generar notificación al médico solicitante
    if (esCritico) {
      const solicitud = await SolicitudLab.findById(solicitudId).populate('medico', '_id');
      if (solicitud) {
        await Notificacion.create({
          usuario: solicitud.medico._id,
          tipo: 'alerta_clinica',
          titulo: '⚠️ Resultado crítico de laboratorio',
          mensaje: `Resultado crítico: ${practica?.nombre || practicaId}. Valor: ${valorNumerico ?? valorTexto}`,
          prioridad: 'alta',
          metadata: { referenciaId: String(resultado._id), modulo: 'laboratorio' },
        });
        await ResultadoLab.findByIdAndUpdate(resultado._id, { alertaEnviada: true });
      }
    }

    res.status(201).json({ ok: true, data: resultado, esCritico });
  } catch (err) { next(err); }
};

exports.listarResultadosPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_desde, practica } = req.query;
    const filtro = { paciente: id };
    if (fecha_desde) filtro.fechaResultado = { $gte: new Date(fecha_desde) };
    if (practica) filtro.practica = practica;
    const resultados = await ResultadoLab.find(filtro)
      .populate('practica', 'nombre unidadMedida rangoNormalMin rangoNormalMax')
      .populate('tecnico', 'nombre apellido')
      .sort({ fechaResultado: -1 })
      .limit(100);
    res.json({ ok: true, data: resultados });
  } catch (err) { next(err); }
};

exports.firmarResultado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultado = await ResultadoLab.findByIdAndUpdate(
      id,
      { 'firma.firmado': true, 'firma.bioquimico': req.user._id, 'firma.fechaFirma': new Date() },
      { new: true }
    );
    if (!resultado) return res.status(404).json({ ok: false, message: 'Resultado no encontrado' });
    res.json({ ok: true, data: resultado });
  } catch (err) { next(err); }
};
