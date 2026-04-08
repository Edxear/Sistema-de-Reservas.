const ComentarioPrivado = require('../models/ComentarioPrivado');
const User = require('../models/User');

const ADMIN_VIEW_ROLES = ['admin', 'superadmin'];
const STAFF_COMMENT_ROLES = ['admin', 'superadmin', 'medico', 'enfermero', 'secretaria'];

const getAuthUserId = (req) => req.user?.id || req.user?._id;

exports.getComentariosPorMedico = async (req, res) => {
  try {
    const objetivoId = req.params.medicoId;
    const usuarioRol = req.user?.rol;

    if (!ADMIN_VIEW_ROLES.includes(usuarioRol)) {
      return res.status(403).json({ message: 'No tienes permiso para ver comentarios privados' });
    }

    const comentarios = await ComentarioPrivado.find({ medico: objetivoId })
      .populate('autor', 'nombre rol')
      .sort({ fechaCreacion: -1 });

    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo comentarios' });
  }
};

exports.getComentariosResumen = async (req, res) => {
  try {
    const usuarioRol = req.user?.rol;
    const { medicoId = '' } = req.query;

    if (!ADMIN_VIEW_ROLES.includes(usuarioRol)) {
      return res.status(403).json({ message: 'No tienes permiso para ver comentarios privados' });
    }

    const filter = {};
    if (medicoId) {
      filter.medico = medicoId;
    }

    const comentarios = await ComentarioPrivado.find(filter)
      .populate('autor', 'nombre rol')
      .populate('medico', 'nombre rol email')
      .sort({ fechaCreacion: -1 })
      .limit(200);

    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo resumen de comentarios' });
  }
};

exports.crearComentario = async (req, res) => {
  try {
    const objetivoId = req.params.medicoId;
    const { contenido } = req.body;
    const autorId = getAuthUserId(req);
    const autorRol = req.user?.rol;

    if (!STAFF_COMMENT_ROLES.includes(autorRol)) {
      return res.status(403).json({ message: 'Solo colegas internos pueden crear comentarios privados' });
    }

    if (!contenido || !String(contenido).trim()) {
      return res.status(400).json({ message: 'El comentario no puede estar vacío' });
    }

    const objetivo = await User.findById(objetivoId).select('rol');
    if (!objetivo || objetivo.rol === 'paciente') {
      return res.status(400).json({ message: 'Debes seleccionar un colega válido' });
    }

    const comentario = new ComentarioPrivado({
      medico: objetivoId,
      autor: autorId,
      contenido: String(contenido).trim(),
      tipoAutor: autorRol,
      esPrivado: true,
    });

    await comentario.save();
    await comentario.populate('autor', 'nombre rol');

    res.status(201).json(comentario);
  } catch (error) {
    res.status(400).json({ message: 'Error creando comentario' });
  }
};

exports.actualizarComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const { contenido } = req.body;
    const usuarioId = getAuthUserId(req);
    const usuarioRol = req.user?.rol;

    if (!contenido || !String(contenido).trim()) {
      return res.status(400).json({ message: 'El comentario no puede estar vacío' });
    }

    const comentario = await ComentarioPrivado.findById(comentarioId);
    if (!comentario) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    const esAutor = String(comentario.autor) === String(usuarioId);
    const esAdminView = ADMIN_VIEW_ROLES.includes(usuarioRol);

    if (!esAutor && !esAdminView) {
      return res.status(403).json({ message: 'No autorizado para actualizar este comentario' });
    }

    comentario.contenido = String(contenido).trim();
    comentario.updatedAt = new Date();
    await comentario.save();
    await comentario.populate('autor', 'nombre rol');

    res.json(comentario);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando comentario' });
  }
};

exports.eliminarComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const usuarioId = getAuthUserId(req);
    const usuarioRol = req.user?.rol;

    const comentario = await ComentarioPrivado.findById(comentarioId);
    if (!comentario) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    const esAutor = String(comentario.autor) === String(usuarioId);
    const esAdminView = ADMIN_VIEW_ROLES.includes(usuarioRol);

    if (!esAutor && !esAdminView) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await ComentarioPrivado.deleteOne({ _id: comentarioId });
    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando comentario' });
  }
};
