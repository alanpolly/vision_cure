const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Please provide all fields' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      fullName
    });

    await user.save();

    // Create JWT Token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.fullName },
        profilePicUrl: user.profilePicUrl
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

// Login user
exports.login = async (req, res) => {
  console.log('[AUTH] Login attempt for:', req.body.email);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[AUTH] Missing email or password');
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    console.log('[AUTH] Finding user in DB...');
    let user;
    try {
      user = await User.findOne({ email });
    } catch (dbErr) {
      console.error('[AUTH] DB Find Error:', dbErr);
      throw dbErr;
    }
    
    if (!user) {
      console.log('[AUTH] User not found');
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    console.log('[AUTH] User found, comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[AUTH] Password mismatch');
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    console.log('[AUTH] Password match, signing token...');
    const payload = { user: { id: user.id } };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' }
    );

    console.log('[AUTH] Login successful for:', email);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.fullName },
        profilePicUrl: user.profilePicUrl
      }
    });
  } catch (err) {
    console.error('[AUTH] Login Error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

// Verify User session
exports.verifySession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.fullName },
        profilePicUrl: user.profilePicUrl
      }
    });
  } catch (err) {
    console.error('Session Error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

// Upload Profile Picture
exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    user.profilePicUrl = fileUrl;
    await user.save();

    res.json({ profilePicUrl: fileUrl });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};
