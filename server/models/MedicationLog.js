const mongoose = require('mongoose');

const medicationLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'TAKEN', 'MISSED'],
    default: 'PENDING'
  },
  takenAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MedicationLog', medicationLogSchema);
