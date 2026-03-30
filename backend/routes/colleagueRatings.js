const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const {
  rateColleague,
  getColleagueRatingSummary,
  deleteColleagueRating,
  listFormalFeedback,
  getFeedbackFramework,
} = require('../controllers/colleagueRatingController');

router.get('/framework', auth, getFeedbackFramework);
router.get('/records', auth, listFormalFeedback);
router.get('/user/:userId/summary', auth, getColleagueRatingSummary);
router.post('/user/:userId', auth, rateColleague);
router.delete('/:ratingId', auth, deleteColleagueRating);

module.exports = router;
