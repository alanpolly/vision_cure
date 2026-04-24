// Quick script to check all users in MongoDB and their telegram IDs
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/visioncure';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const users = await User.find({}).select('-password');
    console.log(`Found ${users.length} users:\n`);

    users.forEach(u => {
      console.log(`  ID:         ${u._id}`);
      console.log(`  Email:      ${u.email}`);
      console.log(`  Name:       ${u.fullName}`);
      console.log(`  TelegramID: ${u.telegramId || '(not set)'}`);
      console.log(`  Caregiver:  ${u.caregiverPhone || '(not set)'}`);
      console.log(`  Created:    ${u.createdAt}`);
      console.log('  ---');
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUsers();
