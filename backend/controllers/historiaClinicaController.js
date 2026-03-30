const HistoriaClinica = require('../models/HistoriaClinica');
const { logAuditEvent } = require('../utils/auditLogger');

const SAFE_TYPES = ['evolucion', 'receta', 'estudio', 'certificado'];

const buildHistoryFilter = ({ pacienteId, tipo, from, to, q }) => {
  const filter = { paciente: pacienteId };

  if (tipo && SAFE_TYPES.includes(tipo)) {
    filter.tipo = tipo;
  }

  if (from || to) {
    filter.fecha = {};
    if (from) filter.fecha.$gte = new Date(from);
    if (to) filter.fecha.$lte = new Date(to);
  }

  if (q) {
    const term = String(q).trim();
    if (term) {
      filter.$or = [
        { descripcion: { $regex: term, $options: 'i' } },
        { 'clinicalSnapshot.diagnostico': { $regex: term, $options: 'i' } },
        { 'clinicalSnapshot.motivoConsulta': { $regex: term, $options: 'i' } },
      ];
    }
  }

  return filter;
};

const buildSummary = (registros = []) => {
  const byType = registros.reduce((acc, item) => {
    const key = item.tipo || 'evolucion';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const diagnosticos = registros
    .map((item) => item.clinicalSnapshot?.diagnostico)
    .filter(Boolean)
    .slice(0, 10);

  const criticos = registros.filter((item) => item.flags?.esCritico).length;
  const seguimiento = registros.filter((item) => item.flags?.requiereSeguimiento).length;

  return {
    total: registros.length,
    byType,
    criticos,
    requiereSeguimiento: seguimiento,
    diagnosticosRecientes: diagnosticos,
    ultimaAtencion: registros[0]?.fecha || null,
  };
};

exports.getPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { tipo, from, to, q } = req.query;
    const filter = buildHistoryFilter({ pacienteId, tipo, from, to, q });

    const registros = await HistoriaClinica.find(filter)
      .populate('medico', 'nombre rol')
      .sort({ fecha: -1 });

    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo historia clínica', error });
  }
};

exports.getLongitudinalPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { tipo, from, to, q } = req.query;
    const filter = buildHistoryFilter({ pacienteId, tipo, from, to, q });

    const registros = await HistoriaClinica.find(filter)
      .populate('medico', 'nombre rol')
      .sort({ fecha: -1 })
      .limit(800);

    const summary = buildSummary(registros);

    const timelineByMonth = registros.reduce((acc, item) => {
      const key = new Date(item.fecha).toISOString().slice(0, 7);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return res.json({
      summary,
      timelineByMonth,
      records: registros,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo vista longitudinal', error });
  }
};

exports.crearRegistro = async (req, res) => {
  try {
    if (!req.body?.paciente) {
      return res.status(400).json({ message: 'Paciente es obligatorio' });
    }

    if (!String(req.body?.descripcion || '').trim()) {
      return res.status(400).json({ message: 'Descripcion es obligatoria' });
    }

    const resolvedTipo = SAFE_TYPES.includes(req.body.tipo) ? req.body.tipo : 'evolucion';

    const registro = new HistoriaClinica({
      ...req.body,
      tipo: resolvedTipo,
      eventCategory: req.body.eventCategory || resolvedTipo,
      medico: req.user.id
    });

    await registro.save();

    await logAuditEvent(req, {
      action: 'historia-clinica.create',
      resourceType: 'HistoriaClinica',
      resourceId: registro._id,
      details: `Registro clinico tipo=${resolvedTipo} paciente=${registro.paciente}`,
    });

    res.status(201).json(registro);
  } catch (error) {
    res.status(400).json({ message: 'Error creando registro', error });
  }
};
