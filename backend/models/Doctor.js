const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  availableSlots: [{ type: Date }],
});

module.exports = mongoose.model('Doctor', DoctorSchema);
