const express = require('express');

const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
  getOrganigrama,
  createOrganigrama,
  updateOrganigrama,
  deleteOrganigrama,
} = require('../controllers/organigramaController');

router.get('/', authMiddleware, getOrganigrama);
router.post('/', authMiddleware, adminMiddleware, createOrganigrama);
router.put('/:id', authMiddleware, adminMiddleware, updateOrganigrama);
router.delete('/:id', authMiddleware, adminMiddleware, deleteOrganigrama);

module.exports = router;
