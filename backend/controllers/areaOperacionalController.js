/**
 * Phase 4 – Area Operacional Controller
 * CRUD for incidents and shift checklists, one set of endpoints for all areas.
 * Area is always validated against the requesting user's profile (areaOwnership middleware
 * handles the sector check for beds; here we use a simpler role check).
 */

const { Incidente, ChecklistTurno } = require('../models/AreaOperacional');
const { logAuditEvent } = require('../utils/auditLogger');

const VALID_AREAS = new Set(['guardia', 'salud-mental', 'mantenimiento', 'paramedicos', 'enfermeria', 'general']);
const ADMIN_ROLES = new Set(['admin', 'superadmin']);

function normalize(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Allow if admin/superadmin, otherwise check organigrama fields for the requested area */
function userCanAccessArea(user, area) {
  const role = normalize(user?.rol || '');
  if (ADMIN_ROLES.has(role)) return true;

  const fields = [
    user?.ramaEnfermeria,
    user?.cargoOrganigrama,
    user?.areaOrganigrama,
    user?.sectorOrganigrama,
  ]
    .filter(Boolean)
    .map(normalize);

  // Map area key to keywords
  const KEYWORDS = {
    'salud-mental': ['salud mental', 'psiquiatr', 'psico'],
    guardia: ['guardia', 'shock', 'emerg', 'triage', 'observacion'],
    mantenimiento: ['mantenimiento', 'infraestructura', 'ingenieria', 'biomed'],
    paramedicos: ['paramedic', 'ambulancia', 'prehospitalario'],
    enfermeria: ['enfermeria', 'enfermero'],
    general: [],
  };

  if (area === 'general') return true;

  const keywords = KEYWORDS[area] || [];
  return fields.some((f) => keywords.some((kw) => f.includes(kw)));
}

// ────────────────── INCIDENTES ──────────────────────────────────────────────

exports.listIncidentes = async (req, res) => {
  try {
    const { area, estado, limit = 50 } = req.query;
    if (area && !VALID_AREAS.has(area)) {
      return res.status(400).json({ message: 'Area invalida' });
    }

    const query = {};
    if (area) query.area = area;
    if (estado) query.estado = estado;

    const items = await Incidente.find(query)
      .populate('creadoPor', 'nombre rol')
      .populate('cerradoPor', 'nombre rol')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo incidentes' });
  }
};

exports.createIncidente = async (req, res) => {
  try {
    const { area, tipo, titulo, descripcion, accion } = req.body;

    if (!area || !titulo) {
      return res.status(400).json({ message: 'area y titulo son obligatorios' });
    }
    if (!VALID_AREAS.has(area)) {
      return res.status(400).json({ message: 'Area invalida' });
    }
    if (!userCanAccessArea(req.user, area)) {
      return res.status(403).json({ message: 'Sin permiso para crear incidentes en esta area' });
    }

    const incidente = await Incidente.create({
      area,
      tipo: tipo || 'medio',
      titulo: String(titulo).trim().slice(0, 200),
      descripcion: String(descripcion || '').trim().slice(0, 1000),
      accion: String(accion || '').trim().slice(0, 600),
      creadoPor: req.user.id,
    });

    await logAuditEvent(req, {
      action: 'area-incidente.create',
      resourceType: 'AreaIncidente',
      resourceId: incidente._id,
      details: `area=${area} tipo=${tipo || 'medio'} titulo=${titulo}`,
    });

    const populated = await Incidente.findById(incidente._id).populate('creadoPor', 'nombre rol');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(400).json({ message: 'Error creando incidente' });
  }
};

exports.updateIncidente = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, accion, descripcion } = req.body;

    const incidente = await Incidente.findById(id);
    if (!incidente) return res.status(404).json({ message: 'Incidente no encontrado' });

    if (!userCanAccessArea(req.user, incidente.area)) {
      return res.status(403).json({ message: 'Sin permiso para modificar este incidente' });
    }

    if (estado) {
      incidente.estado = estado;
      if (estado === 'cerrado' && !incidente.cerradoPor) {
        incidente.cerradoPor = req.user.id;
        incidente.fechaCierre = new Date();
      }
    }
    if (typeof accion !== 'undefined') incidente.accion = String(accion).trim().slice(0, 600);
    if (typeof descripcion !== 'undefined') incidente.descripcion = String(descripcion).trim().slice(0, 1000);

    await incidente.save();

    await logAuditEvent(req, {
      action: 'area-incidente.update',
      resourceType: 'AreaIncidente',
      resourceId: incidente._id,
      details: `estado=${incidente.estado}`,
    });

    const populated = await Incidente.findById(id)
      .populate('creadoPor', 'nombre rol')
      .populate('cerradoPor', 'nombre rol');
    return res.json(populated);
  } catch (error) {
    return res.status(400).json({ message: 'Error actualizando incidente' });
  }
};

// ────────────────── CHECKLIST TURNO ─────────────────────────────────────────

exports.getChecklist = async (req, res) => {
  try {
    const { area, turno, fecha } = req.query;
    if (!area || !turno || !fecha) {
      return res.status(400).json({ message: 'area, turno y fecha son obligatorios' });
    }
    if (!VALID_AREAS.has(area)) {
      return res.status(400).json({ message: 'Area invalida' });
    }

    const parsedFecha = new Date(fecha);
    if (Number.isNaN(parsedFecha.getTime())) {
      return res.status(400).json({ message: 'Fecha invalida (use ISO 8601)' });
    }

    // Normalize to start-of-day UTC for the index
    const dayStart = new Date(parsedFecha);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    let checklist = await ChecklistTurno.findOne({
      area,
      turno,
      fecha: { $gte: dayStart, $lt: dayEnd },
    }).populate('creadoPor', 'nombre rol');

    if (!checklist) {
      return res.json(null);
    }
    return res.json(checklist);
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo checklist' });
  }
};

exports.createChecklist = async (req, res) => {
  try {
    const { area, turno, fecha, items } = req.body;
    if (!area || !turno || !fecha) {
      return res.status(400).json({ message: 'area, turno y fecha son obligatorios' });
    }
    if (!VALID_AREAS.has(area)) {
      return res.status(400).json({ message: 'Area invalida' });
    }
    if (!userCanAccessArea(req.user, area)) {
      return res.status(403).json({ message: 'Sin permiso para crear checklist en esta area' });
    }

    const parsedFecha = new Date(fecha);
    if (Number.isNaN(parsedFecha.getTime())) {
      return res.status(400).json({ message: 'Fecha invalida' });
    }
    parsedFecha.setUTCHours(0, 0, 0, 0);

    const safeItems = Array.isArray(items)
      ? items.map((it) => ({
          descripcion: String(it.descripcion || '').trim().slice(0, 300),
          completado: Boolean(it.completado),
          nota: String(it.nota || '').trim().slice(0, 300),
        }))
      : [];

    const checklist = await ChecklistTurno.create({
      area,
      turno,
      fecha: parsedFecha,
      items: safeItems,
      creadoPor: req.user.id,
    });

    await logAuditEvent(req, {
      action: 'area-checklist.create',
      resourceType: 'AreaChecklist',
      resourceId: checklist._id,
      details: `area=${area} turno=${turno} items=${safeItems.length}`,
    });

    return res.status(201).json(checklist);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Ya existe un checklist para este area, turno y fecha' });
    }
    return res.status(400).json({ message: 'Error creando checklist' });
  }
};

exports.updateChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, cerrado } = req.body;

    const checklist = await ChecklistTurno.findById(id);
    if (!checklist) return res.status(404).json({ message: 'Checklist no encontrado' });

    if (checklist.cerrado) {
      return res.status(409).json({ message: 'El checklist ya fue cerrado y no puede modificarse' });
    }
    if (!userCanAccessArea(req.user, checklist.area)) {
      return res.status(403).json({ message: 'Sin permiso para modificar este checklist' });
    }

    if (Array.isArray(items)) {
      checklist.items = items.map((it) => ({
        descripcion: String(it.descripcion || '').trim().slice(0, 300),
        completado: Boolean(it.completado),
        nota: String(it.nota || '').trim().slice(0, 300),
        completadoPor: it.completado ? (req.user.id) : null,
        completadoAt: it.completado ? new Date() : null,
      }));
    }

    if (cerrado === true) {
      checklist.cerrado = true;
      checklist.cerradoPor = req.user.id;
    }

    await checklist.save();

    await logAuditEvent(req, {
      action: 'area-checklist.update',
      resourceType: 'AreaChecklist',
      resourceId: checklist._id,
      details: `area=${checklist.area} cerrado=${checklist.cerrado}`,
    });

    return res.json(checklist);
  } catch (error) {
    return res.status(400).json({ message: 'Error actualizando checklist' });
  }
};
