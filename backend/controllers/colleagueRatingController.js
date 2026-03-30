const ColleagueRating = require('../models/ColleagueRating');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

const ADMIN_VIEW_ROLES = ['admin', 'superadmin'];
const STAFF_ROLES = ['admin', 'superadmin', 'medico', 'enfermero', 'secretaria'];

const CATEGORIAS = [
  { key: 'calidad_atencion', label: 'Calidad de atención' },
  { key: 'trabajo_equipo', label: 'Trabajo en equipo' },
  { key: 'comunicacion', label: 'Comunicación' },
  { key: 'actitud', label: 'Actitud profesional' },
  { key: 'desempeno_general', label: 'Desempeño general' },
];

const getAuthUserId = (req) => req.user?.id || req.user?._id;

exports.getFeedbackFramework = async (_req, res) => {
  return res.json({
    categorias: CATEGORIAS,
    conclusion: 'Valora a tus colegas de forma simple y constructiva.',
  });
};

exports.rateColleague = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const authorUserId = getAuthUserId(req);
    const authorRole = req.user?.rol;
    const { stars, comentario = '', categoria = 'desempeno_general' } = req.body;

    if (!STAFF_ROLES.includes(authorRole)) {
      return res.status(403).json({ message: 'Solo colegas internos pueden valorar' });
    }

    const parsedStars = parseInt(stars, 10);
    if (!parsedStars || parsedStars < 1 || parsedStars > 5) {
      return res.status(400).json({ message: 'La calificacion debe ser entre 1 y 5' });
    }

    if (String(authorUserId) === String(targetUserId)) {
      return res.status(400).json({ message: 'No puedes valorarte a ti mismo' });
    }

    const targetUser = await User.findById(targetUserId).select('rol');
    if (!targetUser || targetUser.rol === 'paciente') {
      return res.status(400).json({ message: 'Debes seleccionar un colega valido' });
    }

    const resolvedCategoria = CATEGORIAS.some((c) => c.key === categoria) ? categoria : 'desempeno_general';

    const existing = await ColleagueRating.findOne({
      targetUser: targetUserId,
      authorUser: authorUserId,
    });

    if (!existing) {
      const created = await ColleagueRating.create({
        targetUser: targetUserId,
        authorUser: authorUserId,
        stars: parsedStars,
        categoria: resolvedCategoria,
        comentario: String(comentario || '').trim(),
      });
      const populated = await ColleagueRating.findById(created._id)
        .populate('authorUser', 'nombre rol')
        .populate('targetUser', 'nombre rol');
      await logAuditEvent(req, {
        action: 'colleague-rating.create',
        resourceType: 'ColleagueRating',
        resourceId: created._id,
        details: `Categoria=${resolvedCategoria} Estrellas=${parsedStars}`,
      });
      return res.status(201).json(populated);
    }

    existing.stars = parsedStars;
    existing.categoria = resolvedCategoria;
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
      details: `Categoria=${resolvedCategoria} Estrellas=${parsedStars}`,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error guardando valoracion', error });
  }
};

exports.getColleagueRatingSummary = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const actorId = getAuthUserId(req);
    const actorRole = req.user?.rol;

    if (!STAFF_ROLES.includes(actorRole)) {
      return res.status(403).json({ message: 'No tienes permiso para ver valoraciones internas' });
    }

    const [ratings, myRating] = await Promise.all([
      ColleagueRating.find({ targetUser: targetUserId })
        .populate('authorUser', 'nombre rol')
        .sort({ createdAt: -1 }),
      ColleagueRating.findOne({ targetUser: targetUserId, authorUser: actorId }),
    ]);

    const avg = ratings.length
      ? Number((ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length).toFixed(2))
      : 0;

    const response = {
      average: avg,
      total: ratings.length,
      myRating,
    };

    if (ADMIN_VIEW_ROLES.includes(actorRole) || String(actorId) === String(targetUserId)) {
      response.ratings = ratings;
    }

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo resumen de valoraciones', error });
  }
};

exports.listFormalFeedback = async (req, res) => {
  try {
    const actorRole = req.user?.rol;
    if (!ADMIN_VIEW_ROLES.includes(actorRole)) {
      return res.status(403).json({ message: 'Solo administradores pueden ver el historial de valoraciones' });
    }

    const { categoria } = req.query;
    const filter = {};
    if (categoria) filter.categoria = categoria;

    const records = await ColleagueRating.find(filter)
      .populate('authorUser', 'nombre rol')
      .populate('targetUser', 'nombre rol')
      .sort({ createdAt: -1 })
      .limit(400);

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Error listando valoraciones', error });
  }
};

exports.deleteColleagueRating = async (req, res) => {
  try {
    const ratingId = req.params.ratingId;
    const actorId = getAuthUserId(req);
    const actorRole = req.user?.rol;

    const rating = await ColleagueRating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ message: 'Valoracion no encontrada' });
    }

    const isOwner = String(rating.authorUser) === String(actorId);
    const canAdmin = ADMIN_VIEW_ROLES.includes(actorRole);
    if (!isOwner && !canAdmin) {
      return res.status(403).json({ message: 'No autorizado para eliminar esta valoracion' });
    }

    await ColleagueRating.deleteOne({ _id: ratingId });
    await logAuditEvent(req, {
      action: 'colleague-rating.delete',
      resourceType: 'ColleagueRating',
      resourceId: ratingId,
      details: 'Eliminacion de valoracion de colega',
    });
    return res.json({ message: 'Valoracion eliminada' });
  } catch (error) {
    return res.status(500).json({ message: 'Error eliminando valoracion', error });
  }
};

