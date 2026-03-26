const Organigrama = require('../models/Organigrama');

const sanitizeEquipos = (equipos) => {
  if (!Array.isArray(equipos)) return [];
  return equipos
    .map((item) => String(item || '').trim())
    .filter(Boolean);
};

const sanitizePuestos = (puestos) => {
  if (!Array.isArray(puestos)) return [];
  return puestos
    .map((puesto) => ({
      nombre: String(puesto?.nombre || '').trim(),
      personas: Array.isArray(puesto?.personas)
        ? puesto.personas.map((p) => String(p || '').trim()).filter(Boolean)
        : [],
    }))
    .filter((puesto) => puesto.nombre);
};

exports.getOrganigrama = async (req, res) => {
  try {
    const onlyActive = req.query.onlyActive === 'true';
    const query = onlyActive ? { activo: true } : {};
    const rows = await Organigrama.find(query).sort({ orden: 1, area: 1 });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo organigrama', error: error.message });
  }
};

exports.createOrganigrama = async (req, res) => {
  try {
    const payload = {
      area: req.body.area,
      jefe: req.body.jefe,
      subjefe: req.body.subjefe || '',
      equipos: sanitizeEquipos(req.body.equipos),
      puestos: sanitizePuestos(req.body.puestos),
      orden: Number.isFinite(Number(req.body.orden)) ? Number(req.body.orden) : 0,
      activo: typeof req.body.activo === 'boolean' ? req.body.activo : true,
    };

    const created = await Organigrama.create(payload);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: 'Error creando bloque de organigrama', error: error.message });
  }
};

exports.updateOrganigrama = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      ...(req.body.equipos ? { equipos: sanitizeEquipos(req.body.equipos) } : {}),
      ...(req.body.puestos ? { puestos: sanitizePuestos(req.body.puestos) } : {}),
      ...(req.body.orden !== undefined
        ? { orden: Number.isFinite(Number(req.body.orden)) ? Number(req.body.orden) : 0 }
        : {}),
    };

    const updated = await Organigrama.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: 'Bloque no encontrado' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando bloque de organigrama', error: error.message });
  }
};

exports.deleteOrganigrama = async (req, res) => {
  try {
    const removed = await Organigrama.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: 'Bloque no encontrado' });
    res.json({ message: 'Bloque eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando bloque de organigrama', error: error.message });
  }
};
