const User = require('../models/User');

exports.getPerfilPublico = async (req, res) => {
  try {
    const medico = await User.findById(req.params.id).select(
      'nombre rol bio fotoPerfil direccionConsultorio mapaEmbed redesSociales horariosAtencion'
    );
    if (!medico || medico.rol !== 'medico') {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    res.json(medico);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo perfil público', error });
  }
};
