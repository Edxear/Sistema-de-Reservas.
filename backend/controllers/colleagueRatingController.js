const ColleagueRating = require('../models/ColleagueRating');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

const ADMIN_VIEW_ROLES = ['admin', 'superadmin'];
const STAFF_ROLES = ['admin', 'superadmin', 'medico', 'enfermero', 'secretaria'];
const SUPPORT_TEAM_ROLES = ['admin', 'superadmin', 'secretaria', 'enfermero'];
const CLINICAL_ROLES = ['medico', 'enfermero'];

const FEEDBACK_MATRIX = {
  soporte_calidad_atencion: {
    channel: 'gestion_interna_soporte',
    destinationArea: 'gestion_interna_equipo',
    title: 'Entre tecnicos de soporte sobre calidad de atencion',
    requiresStars: true,
    allowedAuthorRoles: SUPPORT_TEAM_ROLES,
  },
  clinico_funcionalidad_sistema: {
    channel: 'comite_funcional',
    destinationArea: 'comite_usuarios_y_requerimientos',
    title: 'Entre profesionales clinicos sobre funcionalidad del sistema',
    requiresStars: false,
    allowedAuthorRoles: CLINICAL_ROLES,
  },
  clinico_uso_incorrecto: {
    channel: 'seguridad_capacitacion',
    destinationArea: 'capacitacion_y_seguridad',
    title: 'Entre trabajadores clinicos sobre uso incorrecto del sistema',
    requiresStars: false,
    allowedAuthorRoles: CLINICAL_ROLES,
  },
  desempeno_no_tecnico: {
    channel: 'rrhh_derivado',
    destinationArea: 'rrhh_centro_salud',
    title: 'Entre colegas sobre desempeno laboral no tecnico',
    requiresStars: false,
    allowedAuthorRoles: STAFF_ROLES,
  },
};

const getAuthUserId = (req) => req.user?.id || req.user?._id;

exports.getFeedbackFramework = async (_req, res) => {
  const items = Object.entries(FEEDBACK_MATRIX).map(([key, item]) => ({
    key,
    ...item,
  }));

  return res.json({
    items,
    conclusion:
      'Las valoraciones se formalizan por canales diferenciados para convertir el feedback en mejoras de soporte y experiencia clinica.',
  });
};

exports.rateColleague = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const authorUserId = getAuthUserId(req);
    const authorRole = req.user?.rol;
    const {
      stars,
      comentario = '',
      feedbackType = 'soporte_calidad_atencion',
      actionItem = '',
      status,
    } = req.body;

    const feedbackConfig = FEEDBACK_MATRIX[feedbackType];
    if (!feedbackConfig) {
      return res.status(400).json({ message: 'Tipo de valoracion no soportado' });
    }

    if (!STAFF_ROLES.includes(authorRole)) {
      return res.status(403).json({ message: 'Solo colegas internos pueden calificar' });
    }

    if (!feedbackConfig.allowedAuthorRoles.includes(authorRole)) {
      return res.status(403).json({ message: 'Tu rol no puede registrar este tipo de valoracion' });
    }

    const parsedStars = Number.isInteger(stars) ? stars : null;

    if (feedbackConfig.requiresStars) {
      if (!Number.isInteger(parsedStars) || parsedStars < 1 || parsedStars > 5) {
        return res.status(400).json({ message: 'La calificacion debe ser un entero entre 1 y 5' });
      }
    }

    if (String(authorUserId) === String(targetUserId)) {
      return res.status(400).json({ message: 'No puedes calificarte a ti mismo' });
    }

    const targetUser = await User.findById(targetUserId).select('rol');
    if (!targetUser || targetUser.rol === 'paciente') {
      return res.status(400).json({ message: 'Debes seleccionar un colega valido' });
    }

    const existing = await ColleagueRating.findOne({
      targetUser: targetUserId,
      authorUser: authorUserId,
      feedbackType,
    });

    const resolvedStatus = status && ['registrado', 'en_revision', 'derivado', 'cerrado'].includes(status)
      ? status
      : (feedbackConfig.channel === 'rrhh_derivado' ? 'derivado' : 'registrado');

    const resolvedStars = feedbackConfig.requiresStars ? parsedStars : (parsedStars || 3);

    if (!existing) {
      const created = await ColleagueRating.create({
        targetUser: targetUserId,
        authorUser: authorUserId,
        stars: resolvedStars,
        feedbackType,
        channel: feedbackConfig.channel,
        destinationArea: feedbackConfig.destinationArea,
        status: resolvedStatus,
        actionItem: String(actionItem || '').trim(),
        comentario: String(comentario || '').trim(),
      });
      const populated = await ColleagueRating.findById(created._id)
        .populate('authorUser', 'nombre rol')
        .populate('targetUser', 'nombre rol');
      await logAuditEvent(req, {
        action: 'colleague-rating.create',
        resourceType: 'ColleagueRating',
        resourceId: created._id,
        details: `Tipo=${feedbackType} Canal=${feedbackConfig.channel}`,
      });
      return res.status(201).json(populated);
    }

    existing.stars = resolvedStars;
    existing.feedbackType = feedbackType;
    existing.channel = feedbackConfig.channel;
    existing.destinationArea = feedbackConfig.destinationArea;
    existing.status = resolvedStatus;
    existing.actionItem = String(actionItem || '').trim();
    existing.comentario = String(comentario || '').trim();
    existing.updatedAt = new Date();
    await existing.save();

    const updated = await ColleagueRating.findById(existing._id)
      .populate('authorUser', 'nombre rol')
      .populate('targetUser', 'nombre rol');

    await logAuditEvent(req, {
      action: 'colleague-rating.update',
      resourceType: 'ColleagueRating',
      resourceId: existing._id,
      details: `Tipo=${feedbackType} Estado=${resolvedStatus}`,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error guardando calificacion', error });
  }
};

exports.getColleagueRatingSummary = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const actorId = getAuthUserId(req);
    const actorRole = req.user?.rol;
    const feedbackType = req.query.feedbackType || 'soporte_calidad_atencion';

    if (!FEEDBACK_MATRIX[feedbackType]) {
      return res.status(400).json({ message: 'Tipo de valoracion no soportado' });
    }

    if (!STAFF_ROLES.includes(actorRole)) {
      return res.status(403).json({ message: 'No tienes permiso para ver calificaciones internas' });
    }

    const [ratings, myRating] = await Promise.all([
      ColleagueRating.find({ targetUser: targetUserId, feedbackType }).populate('authorUser', 'nombre rol').sort({ createdAt: -1 }),
      ColleagueRating.findOne({ targetUser: targetUserId, authorUser: actorId, feedbackType }),
    ]);

    const avg = ratings.length
      ? Number((ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length).toFixed(2))
      : 0;

    const response = {
      average: avg,
      total: ratings.length,
      myRating,
      feedbackType,
      channel: FEEDBACK_MATRIX[feedbackType].channel,
      destinationArea: FEEDBACK_MATRIX[feedbackType].destinationArea,
    };

    if (ADMIN_VIEW_ROLES.includes(actorRole) || String(actorId) === String(targetUserId)) {
      response.ratings = ratings;
    }

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo resumen de calificaciones', error });
  }
};

exports.listFormalFeedback = async (req, res) => {
  try {
    const actorRole = req.user?.rol;
    if (!ADMIN_VIEW_ROLES.includes(actorRole)) {
      return res.status(403).json({ message: 'Solo administradores pueden ver el tablero formal de valoraciones' });
    }

    const { feedbackType, channel, status } = req.query;
    const filter = {};

    if (feedbackType) filter.feedbackType = feedbackType;
    if (channel) filter.channel = channel;
    if (status) filter.status = status;

    const records = await ColleagueRating.find(filter)
      .populate('authorUser', 'nombre rol')
      .populate('targetUser', 'nombre rol')
      .sort({ createdAt: -1 })
      .limit(400);

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Error listando valoraciones formales', error });
  }
};

exports.deleteColleagueRating = async (req, res) => {
  try {
    const ratingId = req.params.ratingId;
    const actorId = getAuthUserId(req);
    const actorRole = req.user?.rol;

    const rating = await ColleagueRating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ message: 'Calificacion no encontrada' });
    }

    const isOwner = String(rating.authorUser) === String(actorId);
    const canAdmin = ADMIN_VIEW_ROLES.includes(actorRole);
    if (!isOwner && !canAdmin) {
      return res.status(403).json({ message: 'No autorizado para eliminar esta calificacion' });
    }

    await ColleagueRating.deleteOne({ _id: ratingId });
    await logAuditEvent(req, {
      action: 'colleague-rating.delete',
      resourceType: 'ColleagueRating',
      resourceId: ratingId,
      details: 'Eliminacion de valoracion formal',
    });
    return res.json({ message: 'Calificacion eliminada' });
  } catch (error) {
    return res.status(500).json({ message: 'Error eliminando calificacion', error });
  }
};
