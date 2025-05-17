const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  purpose: { type: String, required: true },
  appointmentTime: { type: Date, required: true },
  message: { type: String },
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
