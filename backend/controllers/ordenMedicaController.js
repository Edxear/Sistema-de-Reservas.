const OrdenMedica = require('../models/OrdenMedica');
const HistoriaClinica = require('../models/HistoriaClinica');
const { logAuditEvent } = require('../utils/auditLogger');

exports.crearOrden = async (req, res) => {
  try {
    const { paciente, tipo, indicacion, prioridad = 'media', diagnostico = '', fechaObjetivo } = req.body;

    if (!paciente || !tipo || !indicacion) {
      return res.status(400).json({ message: 'paciente, tipo e indicacion son obligatorios' });
    }

    const orden = await OrdenMedica.create({
      paciente,
      medico: req.user.id,
      tipo,
      prioridad,
      indicacion: String(indicacion).trim(),
      diagnostico: String(diagnostico || '').trim(),
      fechaObjetivo: fechaObjetivo ? new Date(fechaObjetivo) : undefined,
    });

    await HistoriaClinica.create({
      paciente,
      medico: req.user.id,
      tipo: 'estudio',
      eventCategory: tipo === 'procedimiento' ? 'procedimiento' : 'estudio',
      fecha: orden.fechaOrden,
      descripcion: `Orden médica ${tipo} (${prioridad}). Indicacion: ${orden.indicacion}`,
      clinicalSnapshot: {
        diagnostico: orden.diagnostico,
        plan: `Estado inicial: ${orden.estado}`,
      },
      metadata: {
        sourceModule: 'ordenes_medicas',
        referenceId: String(orden._id),
      },
      flags: {
        esCritico: prioridad === 'urgente' || prioridad === 'alta',
        requiereSeguimiento: true,
      },
    });

    await logAuditEvent(req, {
      action: 'orden-medica.create',
      resourceType: 'OrdenMedica',
      resourceId: orden._id,
      details: `tipo=${orden.tipo} prioridad=${orden.prioridad}`,
    });

    return res.status(201).json(orden);
  } catch (error) {
    return res.status(400).json({ message: 'Error creando orden medica', error });
  }
};

exports.getPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { estado, tipo } = req.query;
    const query = { paciente: pacienteId };

    if (estado) query.estado = estado;
    if (tipo) query.tipo = tipo;

    const ordenes = await OrdenMedica.find(query)
      .populate('medico', 'nombre rol especialidad')
      .sort({ fechaOrden: -1 })
      .limit(500);

    return res.json(ordenes);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo ordenes medicas', error });
  }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, resultadoResumen = '' } = req.body;

    const orden = await OrdenMedica.findById(id);
    if (!orden) {
      return res.status(404).json({ message: 'Orden medica no encontrada' });
    }

    if (estado) orden.estado = estado;
    if (resultadoResumen) orden.resultadoResumen = String(resultadoResumen).trim();
    await orden.save();

    await logAuditEvent(req, {
      action: 'orden-medica.update-status',
      resourceType: 'OrdenMedica',
      resourceId: orden._id,
      details: `estado=${orden.estado}`,
    });

    return res.json(orden);
  } catch (error) {
    return res.status(400).json({ message: 'Error actualizando orden medica', error });
  }
};
