const express = require('express');
const router = express.Router();
const { 
  getPatients, 
  getPatientById, 
  createPatient, 
  updatePatient 
} = require('../controllers/patientController');

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);

module.exports = router;
