const ComentarioPrivado = require('../models/ComentarioPrivado');
const User = require('../models/User');

/**
 * Obtener comentarios privados de un médico
 * Solo admin/director pueden ver comentarios privados de sus colegas
 */
exports.getComentariosPorMedico = async (req, res) => {
  try {
    const { medicoId } = req.params;
    const usuarioId = req.user._id;
    const usuarioRol = req.user.rol;

    // Verificar que usuario es admin o director
    if (!['admin', 'director'].includes(usuarioRol)) {
      return res.status(403).json({ message: 'No tienes permiso para ver comentarios privados' });
    }

    const comentarios = await ComentarioPrivado.find({ medico: medicoId })
      .populate('autor', 'nombre rol')
      .sort({ fechaCreacion: -1 });

    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo comentarios', error });
  }
};

/**
 * Crear un comentario privado
 */
exports.crearComentario = async (req, res) => {
  try {
    const { medicoId } = req.params;
    const { contenido } = req.body;
    const autorId = req.user._id;
    const autorRol = req.user.rol;

    // Validar permiso
    if (!['admin', 'director'].includes(autorRol)) {
      return res.status(403).json({ message: 'Solo admin/director pueden crear comentarios privados' });
    }

    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({ message: 'El comentario no puede estar vacío' });
    }

    const comentario = new ComentarioPrivado({
      medico: medicoId,
      autor: autorId,
      contenido,
      tipoAutor: autorRol,
      esPrivado: true
    });

    await comentario.save();
    await comentario.populate('autor', 'nombre rol');

    res.status(201).json(comentario);
  } catch (error) {
    res.status(400).json({ message: 'Error creando comentario', error });
  }
};

/**
 * Actualizar un comentario privado
 */
exports.actualizarComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const { contenido } = req.body;
    const usuarioId = req.user._id;

    const comentario = await ComentarioPrivado.findById(comentarioId);
    if (!comentario) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    // Verificar que sea el autor o admin principal
    if (comentario.autor.toString() !== usuarioId.toString() && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para actualizar este comentario' });
    }

    comentario.contenido = contenido;
    comentario.updatedAt = new Date();
    await comentario.save();
    await comentario.populate('autor', 'nombre rol');

    res.json(comentario);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando comentario', error });
  }
};

/**
 * Eliminar un comentario privado
 */
exports.eliminarComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const usuarioId = req.user._id;
    const usuarioRol = req.user.rol;

    const comentario = await ComentarioPrivado.findById(comentarioId);
    if (!comentario) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    // Verificar que sea el autor o admin
    if (comentario.autor.toString() !== usuarioId.toString() && usuarioRol !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await ComentarioPrivado.deleteOne({ _id: comentarioId });
    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando comentario', error });
  }
};
