const ColleagueRating = require('../models/ColleagueRating');
const User = require('../models/User');

const ADMIN_VIEW_ROLES = ['admin', 'superadmin'];
const STAFF_ROLES = ['admin', 'superadmin', 'medico', 'enfermero', 'secretaria'];

const getAuthUserId = (req) => req.user?.id || req.user?._id;

exports.rateColleague = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const authorUserId = getAuthUserId(req);
    const authorRole = req.user?.rol;
    const { stars, comentario = '' } = req.body;

    if (!STAFF_ROLES.includes(authorRole)) {
      return res.status(403).json({ message: 'Solo colegas internos pueden calificar' });
    }

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'La calificacion debe ser un entero entre 1 y 5' });
    }

    if (String(authorUserId) === String(targetUserId)) {
      return res.status(400).json({ message: 'No puedes calificarte a ti mismo' });
    }

    const targetUser = await User.findById(targetUserId).select('rol');
    if (!targetUser || targetUser.rol === 'paciente') {
      return res.status(400).json({ message: 'Debes seleccionar un colega valido' });
    }

    const existing = await ColleagueRating.findOne({ targetUser: targetUserId, authorUser: authorUserId });

    if (!existing) {
      const created = await ColleagueRating.create({
        targetUser: targetUserId,
        authorUser: authorUserId,
        stars,
        comentario: String(comentario || '').trim(),
      });
      const populated = await ColleagueRating.findById(created._id)
        .populate('authorUser', 'nombre rol')
        .populate('targetUser', 'nombre rol');
      return res.status(201).json(populated);
    }

    existing.stars = stars;
    existing.comentario = String(comentario || '').trim();
    existing.updatedAt = new Date();
    await existing.save();

    const updated = await ColleagueRating.findById(existing._id)
      .populate('authorUser', 'nombre rol')
      .populate('targetUser', 'nombre rol');

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

    if (!STAFF_ROLES.includes(actorRole)) {
      return res.status(403).json({ message: 'No tienes permiso para ver calificaciones internas' });
    }

    const [ratings, myRating] = await Promise.all([
      ColleagueRating.find({ targetUser: targetUserId }).populate('authorUser', 'nombre rol').sort({ createdAt: -1 }),
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
    return res.status(500).json({ message: 'Error obteniendo resumen de calificaciones', error });
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
    return res.json({ message: 'Calificacion eliminada' });
  } catch (error) {
    return res.status(500).json({ message: 'Error eliminando calificacion', error });
  }
};
