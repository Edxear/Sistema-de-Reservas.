const BedUnit = require('../models/BedUnit');
const { logAuditEvent } = require('../utils/auditLogger');

exports.listBeds = async (req, res) => {
  try {
    const { sector, estado } = req.query;
    const query = {};

    if (sector) query.sector = sector;
    if (estado) query.estado = estado;

    const beds = await BedUnit.find(query)
      .populate('paciente', 'nombre documento')
      .populate('updatedBy', 'nombre rol')
      .sort({ sector: 1, codigo: 1 });

    const metrics = beds.reduce((acc, bed) => {
      acc.total += 1;
      acc.byEstado[bed.estado] = (acc.byEstado[bed.estado] || 0) + 1;
      return acc;
    }, { total: 0, byEstado: {} });

    return res.json({ metrics, beds });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo censo de camas', error });
  }
};

exports.createBed = async (req, res) => {
  try {
    const { codigo, sector, estado = 'libre', observaciones = '' } = req.body;
    if (!codigo || !sector) {
      return res.status(400).json({ message: 'codigo y sector son obligatorios' });
    }

    const bed = await BedUnit.create({
      codigo: String(codigo).trim(),
      sector: String(sector).trim(),
      estado,
      observaciones: String(observaciones || '').trim(),
      updatedBy: req.user.id,
      updatedAt: new Date(),
    });

    await logAuditEvent(req, {
      action: 'bed-unit.create',
      resourceType: 'BedUnit',
      resourceId: bed._id,
      details: `codigo=${bed.codigo} sector=${bed.sector}`,
    });

    return res.status(201).json(bed);
  } catch (error) {
    return res.status(400).json({ message: 'Error creando cama', error });
  }
};

exports.updateBed = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, paciente, observaciones } = req.body;

    const bed = await BedUnit.findById(id);
    if (!bed) {
      return res.status(404).json({ message: 'Cama no encontrada' });
    }

    if (estado) bed.estado = estado;
    if (typeof paciente !== 'undefined') bed.paciente = paciente || null;
    if (typeof observaciones !== 'undefined') bed.observaciones = String(observaciones || '').trim();
    bed.updatedBy = req.user.id;
    bed.updatedAt = new Date();

    await bed.save();

    await logAuditEvent(req, {
      action: 'bed-unit.update',
      resourceType: 'BedUnit',
      resourceId: bed._id,
      details: `estado=${bed.estado}`,
    });

    const populated = await BedUnit.findById(id)
      .populate('paciente', 'nombre documento')
      .populate('updatedBy', 'nombre rol');

    return res.json(populated);
  } catch (error) {
    return res.status(400).json({ message: 'Error actualizando cama', error });
  }
};
