const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { 
  getPatients, 
  getPatientById, 
  createPatient, 
  updatePatient,
  deletePatient
} = require('../controllers/patientController');

router.get('/', authMiddleware, authorize('admin', 'secretaria'), getPatients);
router.post('/', authMiddleware, authorize('admin', 'secretaria'), createPatient);
router.get('/:id', authMiddleware, authorize('admin', 'secretaria'), getPatientById);
router.put('/:id', authMiddleware, authorize('admin', 'secretaria'), updatePatient);
router.delete('/:id', authMiddleware, authorize('admin', 'secretaria'), deletePatient);

module.exports = router;
