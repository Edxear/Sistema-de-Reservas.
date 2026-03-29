const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
	getDoctors,
	getDoctorById,
	createDoctor,
	updateDoctor,
	deleteDoctor
} = require('../controllers/doctorController');

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', authMiddleware, adminMiddleware, createDoctor);
router.put('/:id', authMiddleware, adminMiddleware, updateDoctor);
router.delete('/:id', authMiddleware, adminMiddleware, deleteDoctor);

module.exports = router;
