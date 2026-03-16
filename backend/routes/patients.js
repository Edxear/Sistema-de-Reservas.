const express = require('express');
const router = express.Router();
const { createPatient, getPatients } = require('../controllers/patientController');

router.get('/', getPatients);
router.post('/', createPatient);

module.exports = router;
