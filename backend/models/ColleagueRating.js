const mongoose = require('mongoose');

const colleagueRatingSchema = new mongoose.Schema({
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comentario: {
    type: String,
    maxlength: 400,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

colleagueRatingSchema.index({ targetUser: 1, authorUser: 1 }, { unique: true });
colleagueRatingSchema.index({ targetUser: 1, createdAt: -1 });

module.exports = mongoose.model('ColleagueRating', colleagueRatingSchema);
