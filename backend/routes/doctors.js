const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { getDoctors, createDoctor } = require('../controllers/doctorController');

router.get('/', getDoctors);
router.post('/', authMiddleware, adminMiddleware, createDoctor);

module.exports = router;
