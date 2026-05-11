const express = require('express');

const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
	listAuditLogs,
	getSecurityAnomalies,
	getPatientAccessReport,
} = require('../controllers/auditLogController');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, listAuditLogs);
router.get('/anomalies', authMiddleware, adminMiddleware, getSecurityAnomalies);
router.get('/patient-access/:pacienteId', authMiddleware, adminMiddleware, getPatientAccessReport);

module.exports = router;
