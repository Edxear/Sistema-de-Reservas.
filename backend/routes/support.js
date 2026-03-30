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
  listKnowledgeArticles,
  createKnowledgeArticle,
  getAdvancedOperationalAnalytics,
} = require('../controllers/supportController');

router.get('/blueprint', auth, admin, getSupportBlueprint);
router.get('/tickets', auth, admin, listSupportTickets);
router.post('/tickets', auth, admin, createSupportTicket);
router.put('/tickets/:id', auth, admin, updateSupportTicket);
router.post('/tickets/:id/survey', auth, admin, submitTicketSurvey);
router.get('/metrics', auth, admin, getSupportMetrics);
router.get('/metrics/advanced', auth, admin, getAdvancedOperationalAnalytics);
router.get('/kb/articles', auth, admin, listKnowledgeArticles);
router.post('/kb/articles', auth, admin, createKnowledgeArticle);

module.exports = router;
