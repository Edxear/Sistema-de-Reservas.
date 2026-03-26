const Rating = require('../models/Rating');
const User = require('../models/User');

/**
 * Obtener ratings de un médico
 */
exports.getRatingsPorMedico = async (req, res) => {
  try {
    const { medicoId } = req.params;
    
    const ratings = await Rating.find({ medico: medicoId })
      .populate('paciente', 'nombre')
      .sort({ fechaCreacion: -1 });

    // Calcular promedio
    const promedio = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.calificacion, 0) / ratings.length).toFixed(2)
      : 0;

    res.json({
      promedio: parseFloat(promedio),
      totalRatings: ratings.length,
      ratings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo ratings', error });
  }
};

/**
 * Crear o actualizar un rating
 */
exports.crearOActualizarRating = async (req, res) => {
  try {
    const { medicoId } = req.params;
    const { pacienteId } = req.body;
    const { calificacion, comentario } = req.body;

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ 
        message: 'Calificación debe ser entre 1 y 5' 
      });
    }

    // Obtener o crear rating
    let rating = await Rating.findOne({ 
      medico: medicoId, 
      paciente: pacienteId 
    });

    if (!rating) {
      rating = new Rating({
        medico: medicoId,
        paciente: pacienteId,
        calificacion,
        comentario
      });
    } else {
      rating.calificacion = calificacion;
      rating.comentario = comentario || rating.comentario;
      rating.updatedAt = new Date();
    }

    await rating.save();
    await rating.populate('paciente', 'nombre');

    res.status(201).json(rating);
  } catch (error) {
    res.status(400).json({ message: 'Error guardando rating', error });
  }
};

/**
 * Obtener el rating del paciente actual para un médico
 */
exports.miRatingPorMedico = async (req, res) => {
  try {
    const { medicoId } = req.params;
    const pacienteId = req.user._id;

    const rating = await Rating.findOne({ 
      medico: medicoId, 
      paciente: pacienteId 
    });

    if (!rating) {
      return res.json(null);
    }

    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo rating', error });
  }
};

/**
 * Eliminar un rating (solo el paciente que lo creó)
 */
exports.eliminarRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const pacienteId = req.user._id;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ message: 'Rating no encontrado' });
    }

    if (rating.paciente.toString() !== pacienteId.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await Rating.deleteOne({ _id: ratingId });
    res.json({ message: 'Rating eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando rating', error });
  }
};
