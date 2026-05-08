const EstudioImagen = require('../models/EstudioImagen');
const SolicitudImagen = require('../models/SolicitudImagen');

// ── Catálogo de estudios ───────────────────────────────────────────────────────

exports.listarEstudios = async (req, res, next) => {
  try {
    const { modalidad } = req.query;
    const filtro = { activo: true };
    if (modalidad) filtro.modalidad = modalidad;
    const estudios = await EstudioImagen.find(filtro).sort({ modalidad: 1, nombre: 1 });
    res.json({ ok: true, data: estudios });
  } catch (err) { next(err); }
};

exports.crearEstudio = async (req, res, next) => {
  try {
    const estudio = await EstudioImagen.create(req.body);
    res.status(201).json({ ok: true, data: estudio });
  } catch (err) { next(err); }
};

// ── Solicitudes de imagen ──────────────────────────────────────────────────────

exports.crearSolicitud = async (req, res, next) => {
  try {
    const { paciente, estudio, areaAnatomica, motivoSolicitud, restricciones, diagnosticoPresuntivo, prioridad, ordenMedica } = req.body;
    const solicitud = await SolicitudImagen.create({
      paciente,
      medico: req.user._id,
      estudio,
      areaAnatomica,
      motivoSolicitud,
      restricciones,
      diagnosticoPresuntivo,
      prioridad,
      ordenMedica: ordenMedica || null,
    });
    res.status(201).json({ ok: true, data: solicitud });
  } catch (err) { next(err); }
};

exports.listarSolicitudesPaciente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const solicitudes = await SolicitudImagen.find({ paciente: id })
      .populate('estudio', 'nombre modalidad duracionMinutos')
      .populate('medico', 'nombre apellido')
      .sort({ fechaSolicitud: -1 })
      .limit(50);
    res.json({ ok: true, data: solicitudes });
  } catch (err) { next(err); }
};

exports.agendarTurno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fechaHora, equipo, sala, tecnicoAsignado } = req.body;
    const solicitud = await SolicitudImagen.findByIdAndUpdate(
      id,
      {
        'turno.fechaHora': fechaHora,
        'turno.equipo': equipo,
        'turno.sala': sala,
        'turno.tecnicoAsignado': tecnicoAsignado,
        estado: 'agendada',
      },
      { new: true }
    );
    if (!solicitud) return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    res.json({ ok: true, data: solicitud });
  } catch (err) { next(err); }
};

exports.cargarInforme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { informe, hallazgos, impresionDiagnostica, urlDicom, urlImagenPreview, dlp, ctdiVol } = req.body;
    const update = {
      'resultado.informe': informe,
      'resultado.hallazgos': hallazgos,
      'resultado.impresionDiagnostica': impresionDiagnostica,
      'resultado.urlDicom': urlDicom || '',
      'resultado.urlImagenPreview': urlImagenPreview || '',
      'resultado.fechaRealizacion': new Date(),
      'resultado.tecnicoRealizo': req.user._id,
      estado: 'realizada',
    };
    if (dlp !== undefined) { update['dosisRadiacion.dlp'] = dlp; update['dosisRadiacion.ctdiVol'] = ctdiVol; update['dosisRadiacion.registrado'] = true; }
    const solicitud = await SolicitudImagen.findByIdAndUpdate(id, update, { new: true });
    if (!solicitud) return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    res.json({ ok: true, data: solicitud });
  } catch (err) { next(err); }
};

exports.firmarInforme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const solicitud = await SolicitudImagen.findByIdAndUpdate(
      id,
      {
        'resultado.firma.firmado': true,
        'resultado.firma.radiologo': req.user._id,
        'resultado.firma.fechaFirma': new Date(),
        estado: 'informada',
      },
      { new: true }
    );
    if (!solicitud) return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
    res.json({ ok: true, data: solicitud });
  } catch (err) { next(err); }
};

exports.agendaEquipo = async (req, res, next) => {
  try {
    const { fecha, equipo } = req.query;
    const filtro = { estado: { $in: ['agendada', 'en_proceso'] } };
    if (fecha) {
      const desde = new Date(fecha); desde.setHours(0, 0, 0, 0);
      const hasta = new Date(fecha); hasta.setHours(23, 59, 59, 999);
      filtro['turno.fechaHora'] = { $gte: desde, $lte: hasta };
    }
    if (equipo) filtro['turno.equipo'] = equipo;
    const agenda = await SolicitudImagen.find(filtro)
      .populate('paciente', 'nombre apellido')
      .populate('estudio', 'nombre modalidad duracionMinutos')
      .sort({ 'turno.fechaHora': 1 });
    res.json({ ok: true, data: agenda });
  } catch (err) { next(err); }
};
