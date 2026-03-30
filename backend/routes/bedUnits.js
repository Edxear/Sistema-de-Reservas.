const express = require('express');

const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { listBeds, createBed, updateBed } = require('../controllers/bedUnitController');

const router = express.Router();

router.get('/', authMiddleware, authorize('medico', 'admin', 'secretaria', 'enfermero', 'superadmin'), listBeds);
router.post('/', authMiddleware, authorize('admin', 'superadmin', 'enfermero'), createBed);
router.put('/:id', authMiddleware, authorize('admin', 'superadmin', 'enfermero'), updateBed);

module.exports = router;
