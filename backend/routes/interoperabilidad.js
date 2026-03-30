const express = require('express');

const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getFhirPatient,
  getFhirClinicalBundle,
  getHL7AdtA04,
} = require('../controllers/interoperabilidadController');

const router = express.Router();

router.get('/fhir/patient/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero', 'superadmin'), getFhirPatient);
router.get('/fhir/bundle/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero', 'superadmin'), getFhirClinicalBundle);
router.get('/hl7/adt-a04/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero', 'superadmin'), getHL7AdtA04);

module.exports = router;
