const express = require('express');

const auth = require('../middleware/auth');
const {
  createChecklist,
  createIncident,
  createInitiative,
  getNursingCatalog,
  getNursingConfig,
  getNursingDashboard,
  getNursingOrganigrama,
  listChecklists,
  listIncidents,
  listInitiatives,
  updateNursingConfig,
  updateIncidentStatus,
  updateInitiative,
} = require('../controllers/nursingController');

const router = express.Router();

router.get('/catalog', auth, getNursingCatalog);
router.get('/config', auth, getNursingConfig);
router.put('/config', auth, updateNursingConfig);
router.get('/dashboard', auth, getNursingDashboard);
router.get('/organigrama', auth, getNursingOrganigrama);

router.get('/initiatives', auth, listInitiatives);
router.post('/initiatives', auth, createInitiative);
router.put('/initiatives/:id', auth, updateInitiative);

router.get('/checklists', auth, listChecklists);
router.post('/checklists', auth, createChecklist);

router.get('/incidents', auth, listIncidents);
router.post('/incidents', auth, createIncident);
router.put('/incidents/:id/status', auth, updateIncidentStatus);

module.exports = router;
