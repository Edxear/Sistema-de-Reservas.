const AuditLog = require('../models/AuditLog');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '';
}

async function logAuditEvent(req, event) {
  try {
    await AuditLog.create({
      actorUser: req.user?.id || req.user?._id || null,
      actorRole: req.user?.rol || 'desconocido',
      action: event.action,
      resourceType: event.resourceType,
      resourceId: String(event.resourceId || ''),
      status: event.status || 'success',
      details: String(event.details || '').slice(0, 600),
      ip: getClientIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 400),
    });
  } catch (error) {
    // Auditoria nunca debe interrumpir el flujo de negocio
    console.error('Audit logger error:', error.message);
  }
}

module.exports = {
  logAuditEvent,
};
