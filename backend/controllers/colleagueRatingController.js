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

exports.getStaffDirectory = async (req, res) => {
  try {
    const actorRole = req.user?.rol;
    if (!STAFF_ROLES.includes(actorRole)) {
      return res.status(403).json({ message: 'No tienes permiso para ver colegas internos' });
    }

    const staff = await User.find({ rol: { $in: STAFF_ROLES } })
      .select('_id nombre email rol telefono')
      .sort({ nombre: 1 });

    return res.json(staff);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo directorio de colegas', error });
  }
};

exports.rateColleague = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const authorUserId = getAuthUserId(req);
    const authorRole = req.user?.rol;
    const { stars, comentario = '', categoria = 'desempeno_general', ratings = null } = req.body;

    if (!STAFF_ROLES.includes(authorRole)) {
      return res.status(403).json({ message: 'Solo colegas internos pueden valorar' });
    }

    if (String(authorUserId) === String(targetUserId)) {
      return res.status(400).json({ message: 'No puedes valorarte a ti mismo' });
    }

    const targetUser = await User.findById(targetUserId).select('rol');
    if (!targetUser || targetUser.rol === 'paciente') {
      return res.status(400).json({ message: 'Debes seleccionar un colega valido' });
    }

    const normalizedComment = String(comentario || '').trim();

    if (Array.isArray(ratings) && ratings.length > 0) {
      const normalizedRatings = ratings
        .map((item) => {
          const safeCategoria = CATEGORIAS.some((c) => c.key === item?.categoria)
            ? item.categoria
            : null;
          const safeStars = parseInt(item?.stars, 10);
          return {
            categoria: safeCategoria,
            stars: safeStars,
          };
        })
        .filter((item) => item.categoria && item.stars >= 1 && item.stars <= 5);

      if (!normalizedRatings.length) {
        return res.status(400).json({ message: 'Debes enviar al menos una categoria valida con estrellas entre 1 y 5' });
      }

      const dedup = new Map();
      normalizedRatings.forEach((item) => {
        dedup.set(item.categoria, item.stars);
      });

      const upserts = Array.from(dedup.entries()).map(([cat, catStars]) => (
        ColleagueRating.findOneAndUpdate(
          {
            targetUser: targetUserId,
            authorUser: authorUserId,
            categoria: cat,
          },
          {
            $set: {
              stars: catStars,
              comentario: normalizedComment,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              targetUser: targetUserId,
              authorUser: authorUserId,
              categoria: cat,
              createdAt: new Date(),
            },
          },
          {
            new: true,
            upsert: true,
          },
        )
      ));

      const saved = await Promise.all(upserts);
      const ids = saved.map((item) => item._id);
      const populated = await ColleagueRating.find({ _id: { $in: ids } })
        .populate('authorUser', 'nombre rol')
        .populate('targetUser', 'nombre rol');

      await logAuditEvent(req, {
        action: 'colleague-rating.batch-upsert',
        resourceType: 'ColleagueRating',
        resourceId: targetUserId,
        details: `Categorias=${Array.from(dedup.keys()).join(',')}`,
      });

      return res.status(201).json({
        message: 'Valoraciones guardadas',
        ratings: populated,
      });
    }

    const parsedStars = parseInt(stars, 10);
    if (!parsedStars || parsedStars < 1 || parsedStars > 5) {
      return res.status(400).json({ message: 'La calificacion debe ser entre 1 y 5' });
    }

    const resolvedCategoria = CATEGORIAS.some((c) => c.key === categoria) ? categoria : 'desempeno_general';

    const existing = await ColleagueRating.findOne({
      targetUser: targetUserId,
      authorUser: authorUserId,
      categoria: resolvedCategoria,
    });

    if (!existing) {
      const created = await ColleagueRating.create({
        targetUser: targetUserId,
        authorUser: authorUserId,
        stars: parsedStars,
        categoria: resolvedCategoria,
        comentario: normalizedComment,
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
    existing.comentario = normalizedComment;
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

    const [ratings, myRatings] = await Promise.all([
      ColleagueRating.find({ targetUser: targetUserId })
        .populate('authorUser', 'nombre rol')
        .sort({ createdAt: -1 }),
      ColleagueRating.find({ targetUser: targetUserId, authorUser: actorId }),
    ]);

    const avg = ratings.length
      ? Number((ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length).toFixed(2))
      : 0;

    const categoryAverages = CATEGORIAS.reduce((acc, category) => {
      const list = ratings.filter((r) => r.categoria === category.key);
      acc[category.key] = list.length
        ? Number((list.reduce((sum, r) => sum + r.stars, 0) / list.length).toFixed(2))
        : 0;
      return acc;
    }, {});

    const response = {
      average: avg,
      total: ratings.length,
      myRating: myRatings[0] || null,
      myRatings,
      categoryAverages,
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

