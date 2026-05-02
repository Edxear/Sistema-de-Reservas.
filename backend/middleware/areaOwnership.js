/**
 * Phase 2 – Area Ownership Middleware
 * Validates that the authenticated user is authorized to operate on the
 * requested area. Admins and superadmins bypass every check.
 *
 * Usage:
 *   router.put('/:id', authMiddleware, areaOwnership('bed'), authorize(...), updateBed)
 *
 * Supported resources:
 *   'bed'     – checks sector of the BedUnit against user's area profiles
 *   'area'    – checks req.body.area or req.query.area against user profiles
 */

const BedUnit = require('../models/BedUnit');

const normalize = (value = '') =>
  String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const ADMIN_ROLES = new Set(['admin', 'superadmin']);

// Maps area keywords to the sectors they govern (lowercase, normalised)
const AREA_SECTORS = {
  'salud-mental': ['salud mental', 'psiquiatr', 'neuropsiq', 'psico'],
  guardia: ['guardia', 'shock', 'triage', 'emerg', 'observacion'],
  mantenimiento: ['mantenimiento', 'infraestructura', 'ingenieria'],
  paramedicos: ['paramedic', 'ambulancia', 'prehospitalario'],
};

/**
 * Derive the set of area keys a user is authorised to touch based on
 * their organigrama / enfermeria profile fields.
 */
function getUserAreaKeys(user) {
  const fields = [
    user?.ramaEnfermeria,
    user?.cargoOrganigrama,
    user?.areaOrganigrama,
    user?.sectorOrganigrama,
  ]
    .filter(Boolean)
    .map(normalize);

  const keys = new Set();
  for (const [key, keywords] of Object.entries(AREA_SECTORS)) {
    if (fields.some((f) => keywords.some((kw) => f.includes(kw)))) {
      keys.add(key);
    }
  }
  return keys;
}

/**
 * Determine the area key for a given sector string.
 */
function sectorToAreaKey(sector = '') {
  const s = normalize(sector);
  for (const [key, keywords] of Object.entries(AREA_SECTORS)) {
    if (keywords.some((kw) => s.includes(kw))) return key;
  }
  return 'general';
}

/**
 * Factory: returns an Express middleware for the specified resource type.
 */
function areaOwnership(resource = 'bed') {
  return async function checkAreaOwnership(req, res, next) {
    try {
      const role = normalize(req.user?.rol || '');
      if (ADMIN_ROLES.has(role)) return next(); // admins bypass

      const userAreas = getUserAreaKeys(req.user);

      if (resource === 'bed') {
        // For bed updates we look up the existing bed to get its sector
        const bedId = req.params.id;
        if (!bedId) return res.status(400).json({ message: 'ID de cama requerido' });

        const bed = await BedUnit.findById(bedId).select('sector');
        if (!bed) return res.status(404).json({ message: 'Cama no encontrada' });

        const areaKey = sectorToAreaKey(bed.sector);
        // 'general' areas are accessible to all clinical staff
        if (areaKey === 'general') return next();

        if (!userAreas.has(areaKey)) {
          return res.status(403).json({
            message: `Sin permiso para modificar camas del sector "${bed.sector}". Revisa tu perfil de area en el organigrama.`,
          });
        }
        return next();
      }

      if (resource === 'area') {
        const requestedArea = normalize(req.body?.area || req.query?.area || '');
        if (!requestedArea) return next(); // no area filter – controller decides

        const matched = [...Object.entries(AREA_SECTORS)].find(([, keywords]) =>
          keywords.some((kw) => requestedArea.includes(kw))
        );

        if (!matched) return next(); // unknown area – controller decides

        const [areaKey] = matched;
        if (!userAreas.has(areaKey)) {
          return res.status(403).json({
            message: `Sin permiso para operar en el area "${requestedArea}".`,
          });
        }
        return next();
      }

      return next();
    } catch (error) {
      return res.status(500).json({ message: 'Error validando propiedad de area' });
    }
  };
}

module.exports = areaOwnership;
