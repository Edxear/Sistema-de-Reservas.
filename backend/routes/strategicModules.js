const express = require('express');
const auth = require('../middleware/auth');
const {
  listStrategicModules,
  getStrategicModuleDetail,
  patchModuleCheckpoint,
} = require('../controllers/strategicModulesController');

const router = express.Router();

router.get('/', auth, listStrategicModules);
router.get('/:slug', auth, getStrategicModuleDetail);
router.patch('/:slug/checkpoints', auth, patchModuleCheckpoint);

module.exports = router;