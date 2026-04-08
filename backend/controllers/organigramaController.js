const mongoose = require('mongoose');
const Organigrama = require('../models/Organigrama');
const OrganigramaAudit = require('../models/OrganigramaAudit');
const organigramaSeed = require('../seeds/organigrama-hospitalario.json');

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

const parseBoolean = (value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
};

const sanitizeParentId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

const createAuditEntry = async ({ action, organigramaId = null, user, before = null, after = null, metadata = null }) => {
  try {
    await OrganigramaAudit.create({
      action,
      organigramaId,
      userId: user?.id && mongoose.Types.ObjectId.isValid(user.id) ? user.id : null,
      userRol: user?.rol || '',
      before,
      after,
      metadata,
    });
  } catch {
    // Avoid breaking business actions when audit persistence fails.
  }
};

const ensureInitialHospitalExample = async () => {
  const [rowsCount, auditCount] = await Promise.all([
    Organigrama.countDocuments({}),
    OrganigramaAudit.countDocuments({}),
  ]);

  // Seed only once for fresh installations. If there is audit history,
  // we assume users already managed the data and we must not recreate it.
  if (rowsCount > 0 || auditCount > 0) return;

  const bloques = Array.isArray(organigramaSeed?.bloques) ? organigramaSeed.bloques : [];
  if (!bloques.length) return;

  const payload = bloques.map((item, index) => ({
    area: String(item.area || '').trim(),
    jefe: String(item.jefe || '').trim(),
    subjefe: String(item.subjefe || '').trim(),
    equipos: sanitizeEquipos(item.equipos),
    puestos: sanitizePuestos(item.puestos),
    orden: Number.isFinite(Number(item.orden)) ? Number(item.orden) : index + 1,
    activo: typeof item.activo === 'boolean' ? item.activo : true,
  })).filter((item) => item.area && item.jefe);

  if (!payload.length) return;

  await Organigrama.insertMany(payload, { ordered: true });
};

exports.getOrganigrama = async (req, res) => {
  try {
    await ensureInitialHospitalExample();

    const q = String(req.query.q || '').trim();
    const pageRaw = Number.parseInt(req.query.page, 10);
    const limitRaw = Number.parseInt(req.query.limit, 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 12;
    const onlyActive = parseBoolean(req.query.onlyActive);
    const status = String(req.query.status || 'todos').toLowerCase();

    const query = {};
    if (onlyActive === true || status === 'activos') {
      query.activo = true;
    } else if (status === 'inactivos') {
      query.activo = false;
    }

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { area: regex },
        { jefe: regex },
        { subjefe: regex },
        { equipos: regex },
        { 'puestos.nombre': regex },
        { 'puestos.personas': regex },
      ];
    }

    const [items, totalItems] = await Promise.all([
      Organigrama.find(query)
        .sort({ orden: 1, area: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Organigrama.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    res.json({
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo organigrama' });
  }
};

exports.createOrganigrama = async (req, res) => {
  try {
    const payload = {
      area: req.body.area,
      parentId: sanitizeParentId(req.body.parentId),
      jefe: req.body.jefe,
      subjefe: req.body.subjefe || '',
      equipos: sanitizeEquipos(req.body.equipos),
      puestos: sanitizePuestos(req.body.puestos),
      orden: Number.isFinite(Number(req.body.orden)) ? Number(req.body.orden) : 0,
      activo: typeof req.body.activo === 'boolean' ? req.body.activo : true,
    };

    const created = await Organigrama.create(payload);
    await createAuditEntry({
      action: 'create',
      organigramaId: created._id,
      user: req.user,
      after: created.toObject(),
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: 'Error creando bloque de organigrama' });
  }
};

exports.updateOrganigrama = async (req, res) => {
  try {
    const before = await Organigrama.findById(req.params.id);
    if (!before) return res.status(404).json({ message: 'Bloque no encontrado' });

    const payload = {
      ...req.body,
      ...(req.body.parentId !== undefined ? { parentId: sanitizeParentId(req.body.parentId) } : {}),
      ...(req.body.equipos ? { equipos: sanitizeEquipos(req.body.equipos) } : {}),
      ...(req.body.puestos ? { puestos: sanitizePuestos(req.body.puestos) } : {}),
      ...(req.body.orden !== undefined
        ? { orden: Number.isFinite(Number(req.body.orden)) ? Number(req.body.orden) : 0 }
        : {}),
    };

    if (String(payload.parentId || '') === String(req.params.id)) {
      return res.status(400).json({ message: 'Un bloque no puede ser padre de sí mismo' });
    }

    const updated = await Organigrama.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    await createAuditEntry({
      action: 'update',
      organigramaId: updated._id,
      user: req.user,
      before: before.toObject(),
      after: updated.toObject(),
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando bloque de organigrama' });
  }
};

exports.deleteOrganigrama = async (req, res) => {
  try {
    const snapshot = await Organigrama.findById(req.params.id);
    const removed = await Organigrama.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: 'Bloque no encontrado' });

    await Organigrama.updateMany({ parentId: removed._id }, { $set: { parentId: null } });
    await createAuditEntry({
      action: 'delete',
      organigramaId: removed._id,
      user: req.user,
      before: snapshot ? snapshot.toObject() : removed.toObject(),
    });

    res.json({ message: 'Bloque eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando bloque de organigrama' });
  }
};

exports.reorderOrganigrama = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Se requiere una lista de items para reordenar' });
    }

    const operations = items
      .filter((item) => item && item.id)
      .map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { orden: Number.isFinite(Number(item.orden)) ? Number(item.orden) : 0 } },
        },
      }));

    if (operations.length === 0) {
      return res.status(400).json({ message: 'No hay operaciones válidas para aplicar' });
    }

    await Organigrama.bulkWrite(operations);
    await createAuditEntry({
      action: 'reorder',
      user: req.user,
      metadata: { items: operations.length },
      after: items,
    });

    const rows = await Organigrama.find().sort({ orden: 1, area: 1 });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error reordenando organigrama' });
  }
};

exports.getOrganigramaAudit = async (req, res) => {
  try {
    const pageRaw = Number.parseInt(req.query.page, 10);
    const limitRaw = Number.parseInt(req.query.limit, 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 20;

    const [items, totalItems] = await Promise.all([
      OrganigramaAudit.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      OrganigramaAudit.countDocuments({}),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    res.json({
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo auditoría de organigrama' });
  }
};
