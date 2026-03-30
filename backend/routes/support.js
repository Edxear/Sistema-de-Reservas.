const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getSupportBlueprint,
  createSupportTicket,
  listSupportTickets,
  updateSupportTicket,
  submitTicketSurvey,
  getSupportMetrics,
} = require('../controllers/supportController');

router.get('/blueprint', auth, admin, getSupportBlueprint);
router.get('/tickets', auth, admin, listSupportTickets);
router.post('/tickets', auth, admin, createSupportTicket);
router.put('/tickets/:id', auth, admin, updateSupportTicket);
router.post('/tickets/:id/survey', auth, admin, submitTicketSurvey);
router.get('/metrics', auth, admin, getSupportMetrics);

module.exports = router;
