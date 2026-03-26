const express = require('express');

const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
  getOrganigrama,
  createOrganigrama,
  updateOrganigrama,
  deleteOrganigrama,
  reorderOrganigrama,
  getOrganigramaAudit,
} = require('../controllers/organigramaController');

router.get('/', getOrganigrama);
router.get('/audit', authMiddleware, adminMiddleware, getOrganigramaAudit);
router.put('/reorder', authMiddleware, adminMiddleware, reorderOrganigrama);
router.post('/', authMiddleware, adminMiddleware, createOrganigrama);
router.put('/:id', authMiddleware, adminMiddleware, updateOrganigrama);
router.delete('/:id', authMiddleware, adminMiddleware, deleteOrganigrama);

module.exports = router;
