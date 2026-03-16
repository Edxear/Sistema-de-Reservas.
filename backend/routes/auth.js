const express = require('express');
const router = express.Router();
const { registerPatient, loginPatient } = require('../controllers/authController');

router.post('/register', registerPatient);
router.post('/login', loginPatient);

module.exports = router;
