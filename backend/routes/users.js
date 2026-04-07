const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const authorize = require('../middleware/authorize');
const { getUsers, deleteUser, updateUser, searchUsers } = require('../controllers/userController');

// Clinical staff can search users (patients/medicos) for record linking
router.get('/buscar', authMiddleware, authorize('medico', 'admin', 'superadmin', 'enfermero', 'secretaria'), searchUsers);
router.get('/', authMiddleware, adminMiddleware, getUsers);
router.put('/:id', authMiddleware, adminMiddleware, updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

module.exports = router;
