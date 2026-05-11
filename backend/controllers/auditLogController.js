const AuditLog = require('../models/AuditLog');

exports.listAuditLogs = async (req, res) => {
  try {
    const {
      action,
      resourceType,
      status,
      actorUser,
      from,
      to,
      q,
      limit = 100,
    } = req.query;
    const query = {};

    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (status) query.status = status;
    if (actorUser) query.actorUser = actorUser;
    if (q) {
      query.$or = [
        { action: { $regex: q, $options: 'i' } },
        { resourceType: { $regex: q, $options: 'i' } },
        { details: { $regex: q, $options: 'i' } },
      ];
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));

    const logs = await AuditLog.find(query)
      .populate('actorUser', 'nombre email rol')
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo auditoria' });
  }
};

exports.getSecurityAnomalies = async (req, res) => {
  try {
    const hours = Math.max(1, Math.min(Number(req.query.hours) || 1, 168));
    const threshold = Math.max(10, Math.min(Number(req.query.threshold) || 50, 2000));
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const highVolumeUsers = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$actorUser', actorRole: { $first: '$actorRole' }, total: { $sum: 1 } } },
      { $match: { total: { $gte: threshold } } },
      { $sort: { total: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          userId: '$_id',
          total: 1,
          actorRole: 1,
          nombre: { $arrayElemAt: ['$user.nombre', 0] },
          email: { $arrayElemAt: ['$user.email', 0] },
        },
      },
    ]);

    const failedAttempts = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: since }, status: 'failed' } },
      { $group: { _id: '$actorUser', totalFailed: { $sum: 1 } } },
      { $sort: { totalFailed: -1 } },
      { $limit: 50 },
    ]);

    return res.json({
      ok: true,
      windowHours: hours,
      threshold,
      highVolumeUsers,
      failedAttempts,
    });
  } catch (_error) {
    return res.status(500).json({ message: 'Error obteniendo anomalias de seguridad' });
  }
};

exports.getPatientAccessReport = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const parsedLimit = Math.max(1, Math.min(Number(req.query.limit) || 200, 1000));

    const logs = await AuditLog.find({
      $or: [
        { resourceType: 'patient', resourceId: String(pacienteId) },
        { resourceType: 'historia_clinica', resourceId: String(pacienteId) },
      ],
    })
      .populate('actorUser', 'nombre email rol')
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    return res.json({ ok: true, pacienteId, total: logs.length, logs });
  } catch (_error) {
    return res.status(500).json({ message: 'Error obteniendo reporte de accesos del paciente' });
  }
};
