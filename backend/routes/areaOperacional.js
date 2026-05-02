const express = require('express');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const areaOwnership = require('../middleware/areaOwnership');
const {
  listIncidentes,
  createIncidente,
  updateIncidente,
  getChecklist,
  createChecklist,
  updateChecklist,
} = require('../controllers/areaOperacionalController');

const router = express.Router();

const CLINICAL_ROLES = ['medico', 'enfermero', 'admin', 'superadmin'];

// ── Incidentes ────────────────────────────────────────────────────────────────
router.get(
  '/incidentes',
  authMiddleware,
  authorize(...CLINICAL_ROLES),
  listIncidentes
);

router.post(
  '/incidentes',
  authMiddleware,
  authorize(...CLINICAL_ROLES),
  areaOwnership('area'),
  createIncidente
);

router.put(
  '/incidentes/:id',
  authMiddleware,
  authorize(...CLINICAL_ROLES),
  updateIncidente
);

// ── Checklist turno ──────────────────────────────────────────────────────────
router.get(
  '/checklist',
  authMiddleware,
  authorize(...CLINICAL_ROLES),
  getChecklist
);

router.post(
  '/checklist',
  authMiddleware,
  authorize(...CLINICAL_ROLES),
  areaOwnership('area'),
  createChecklist
);

router.put(
  '/checklist/:id',
  authMiddleware,
  authorize(...CLINICAL_ROLES),
  updateChecklist
);

module.exports = router;
