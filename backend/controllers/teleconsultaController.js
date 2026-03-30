const Teleconsulta = require('../models/Teleconsulta');
const { logAuditEvent } = require('../utils/auditLogger');

exports.createTeleconsulta = async (req, res) => {
  try {
    const { paciente, medico, booking, fechaProgramada, enlaceSala, notas = '' } = req.body;

    if (!paciente || !medico || !fechaProgramada || !enlaceSala) {
      return res.status(400).json({ message: 'paciente, medico, fechaProgramada y enlaceSala son obligatorios' });
    }

    const teleconsulta = await Teleconsulta.create({
      paciente,
      medico,
      booking: booking || null,
      fechaProgramada: new Date(fechaProgramada),
      enlaceSala: String(enlaceSala).trim(),
      notas: String(notas || '').trim(),
    });

    await logAuditEvent(req, {
      action: 'teleconsulta.create',
      resourceType: 'Teleconsulta',
      resourceId: teleconsulta._id,
      details: `fecha=${teleconsulta.fechaProgramada.toISOString()}`,
    });

    return res.status(201).json(teleconsulta);
  } catch (error) {
    return res.status(400).json({ message: 'Error creando teleconsulta', error });
  }
};

exports.listMyTeleconsultas = async (req, res) => {
  try {
    const actorId = req.user?.id;
    const actorRole = req.user?.rol;

    const query = {};
    if (actorRole === 'paciente') {
      query.paciente = actorId;
    } else if (actorRole === 'medico') {
      query.medico = actorId;
    }

    const teleconsultas = await Teleconsulta.find(query)
      .populate('paciente', 'nombre email')
      .populate('medico', 'nombre especialidad')
      .sort({ fechaProgramada: -1 })
      .limit(300);

    return res.json(teleconsultas);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo teleconsultas', error });
  }
};

exports.updateTeleconsultaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    const teleconsulta = await Teleconsulta.findById(id);
    if (!teleconsulta) {
      return res.status(404).json({ message: 'Teleconsulta no encontrada' });
    }

    if (estado) teleconsulta.estado = estado;
    if (typeof notas !== 'undefined') teleconsulta.notas = String(notas || '').trim();
    await teleconsulta.save();

    await logAuditEvent(req, {
      action: 'teleconsulta.update-status',
      resourceType: 'Teleconsulta',
      resourceId: teleconsulta._id,
      details: `estado=${teleconsulta.estado}`,
    });

    return res.json(teleconsulta);
  } catch (error) {
    return res.status(400).json({ message: 'Error actualizando teleconsulta', error });
  }
};
