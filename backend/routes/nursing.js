const express = require('express');

const auth = require('../middleware/auth');
const {
  createChecklist,
  createIncident,
  createInitiative,
  getNursingCatalog,
  getNursingConfig,
  listNursingContacts,
  getNursingDashboard,
  getNursingOrganigrama,
  getNursingWorkload,
  createAyudaRapida,
  listChecklists,
  listIncidents,
  listInitiatives,
  listWoundPhotos,
  createWoundPhoto,
  updateWoundPhoto,
  updateNursingConfig,
  updateIncidentStatus,
  updateInitiative,
  listShiftTasks,
  generateShiftTasks,
  updateShiftTask,
  listHandoffs,
  createHandoff,
  updateHandoffStatus,
} = require('../controllers/nursingController');

const router = express.Router();

router.get('/catalog', auth, getNursingCatalog);
router.get('/config', auth, getNursingConfig);
router.put('/config', auth, updateNursingConfig);
router.get('/dashboard', auth, getNursingDashboard);
router.get('/organigrama', auth, getNursingOrganigrama);
router.get('/workload', auth, getNursingWorkload);
router.post('/ayuda-rapida', auth, createAyudaRapida);
router.get('/contacts', auth, listNursingContacts);

router.get('/initiatives', auth, listInitiatives);
router.post('/initiatives', auth, createInitiative);
router.put('/initiatives/:id', auth, updateInitiative);

router.get('/checklists', auth, listChecklists);
router.post('/checklists', auth, createChecklist);

router.get('/incidents', auth, listIncidents);
router.post('/incidents', auth, createIncident);
router.put('/incidents/:id/status', auth, updateIncidentStatus);

router.get('/shift-tasks', auth, listShiftTasks);
router.post('/shift-tasks/generate', auth, generateShiftTasks);
router.patch('/shift-tasks/:id', auth, updateShiftTask);

router.get('/handoffs', auth, listHandoffs);
router.post('/handoffs', auth, createHandoff);
router.patch('/handoffs/:id/status', auth, updateHandoffStatus);

router.get('/wound-photos', auth, listWoundPhotos);
router.post('/wound-photos', auth, createWoundPhoto);
router.put('/wound-photos/:id', auth, updateWoundPhoto);

module.exports = router;
