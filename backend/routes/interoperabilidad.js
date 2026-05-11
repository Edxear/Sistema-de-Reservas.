const express = require('express');

const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getFhirPatient,
  getFhirClinicalBundle,
  getFhirObservations,
  getHL7AdtA04,
  createExternalEndpoint,
  listExternalEndpoints,
  upsertConsent,
  getPatientConsents,
  listTransactions,
} = require('../controllers/interoperabilidadController');

const router = express.Router();

router.get('/fhir/patient/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero', 'superadmin'), getFhirPatient);
router.get('/fhir/bundle/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero', 'superadmin'), getFhirClinicalBundle);
router.get('/fhir/observations/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero', 'superadmin'), getFhirObservations);
router.get('/hl7/adt-a04/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero', 'superadmin'), getHL7AdtA04);

router.get('/endpoints', authMiddleware, authorize('admin', 'superadmin'), listExternalEndpoints);
router.post('/endpoints', authMiddleware, authorize('admin', 'superadmin'), createExternalEndpoint);

router.get('/consentimientos/:pacienteId', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero', 'superadmin'), getPatientConsents);
router.put('/consentimientos/:pacienteId', authMiddleware, authorize('admin', 'superadmin', 'medico', 'secretaria'), upsertConsent);

router.get('/transacciones', authMiddleware, authorize('admin', 'superadmin'), listTransactions);

module.exports = router;
