const express = require('express');
const auth = require('../middleware/auth');
const {
  listStrategicModules,
  getStrategicModuleDetail,
} = require('../controllers/strategicModulesController');

const router = express.Router();

router.get('/', auth, listStrategicModules);
router.get('/:slug', auth, getStrategicModuleDetail);

module.exports = router;