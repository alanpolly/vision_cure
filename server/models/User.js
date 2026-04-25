const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  profilePicUrl: {
    type: String,
    default: ''
  },
  telegramId: {
    type: String,
    default: ''
  },
  caregiverPhone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  recoveryMail: {
    type: String,
    default: ''
  },
  securityQuestion: {
    type: String,
    default: ''
  },
  securityAnswer: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
