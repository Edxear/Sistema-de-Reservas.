const AuditLog = require('../models/AuditLog');

exports.listAuditLogs = async (req, res) => {
  try {
    const { action, resourceType, status, actorUser, limit = 100 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (status) query.status = status;
    if (actorUser) query.actorUser = actorUser;

    const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));

    const logs = await AuditLog.find(query)
      .populate('actorUser', 'nombre email rol')
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo auditoria', error });
  }
};
