const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { getUsers, deleteUser, updateUser } = require('../controllers/userController');

router.get('/', authMiddleware, adminMiddleware, getUsers);
router.put('/:id', authMiddleware, adminMiddleware, updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

module.exports = router;
