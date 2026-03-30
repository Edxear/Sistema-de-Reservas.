const express = require('express');

const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { listAuditLogs } = require('../controllers/auditLogController');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, listAuditLogs);

module.exports = router;
