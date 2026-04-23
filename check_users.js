const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const User = require('./server/models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const users = await User.find({}, 'email fullName password').lean();
    console.log('Users count:', users.length);
    users.forEach(u => {
      console.log(`User: ${u.email}, Name: ${u.fullName}, HasPassword: ${!!u.password}`);
      if (u.password && !u.password.startsWith('$2')) {
        console.warn(`WARNING: User ${u.email} has a non-bcrypt password hash?`);
      }
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
