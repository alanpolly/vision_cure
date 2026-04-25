const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendMessage, bot } = require('../services/telegramBot');

/**
 * POST /api/user/profile
 * Updates a user's Telegram ID and Caregiver Phone in MongoDB
 */
router.post('/profile', async (req, res) => {
  const telegramId = req.body.telegramId;
  const caregiverPhone = req.body.caregiverPhone;
  const userId = req.body.userId ? String(req.body.userId) : null;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const updateFields = {};
    if (telegramId !== undefined) updateFields.telegramId = telegramId;
    if (caregiverPhone !== undefined) updateFields.caregiverPhone = caregiverPhone;

    const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[USER PROFILE] Updated user ${userId}: telegramId=${user.telegramId}, caregiverPhone=${user.caregiverPhone}`);
    res.json({ success: true, message: 'Profile updated successfully', profile: { telegram_id: user.telegramId, caregiver_phone: user.caregiverPhone } });
  } catch (err) {
    console.error('[USER PROFILE ERROR]', err.message);
    res.status(500).json({ error: 'Failed to update profile', message: err.message });
  }
});

/**
 * GET /api/user/profile/:userId
 * Fetches a user's profile information from MongoDB
 */
router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ profile: null });
    }

    res.json({
      profile: {
        telegram_id: user.telegramId || '',
        caregiver_phone: user.caregiverPhone || '',
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (err) {
    console.error('[USER PROFILE FETCH ERROR]', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/user/telegram-test
 * Sends a test message to the user's Telegram ID to verify the bot works
 */
router.post('/telegram-test', async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId) {
    return res.status(400).json({ error: 'Missing telegramId' });
  }

  if (!bot) {
    return res.status(503).json({ error: 'Telegram bot is not initialized. Check TELEGRAM_BOT_TOKEN in .env' });
  }

  try {
    const testMsg = `✅ VisionCure Test Message\n\nHello! Your Telegram integration is working perfectly.\n\n🕐 Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n💊 You will receive medication reminders here.\n\nReply TAKEN to acknowledge future reminders.`;
    await sendMessage(telegramId, testMsg);
    console.log(`[TELEGRAM TEST] Test message sent successfully to ${telegramId}`);
    res.json({ success: true, message: `Test message sent to Telegram ID: ${telegramId}` });
  } catch (err) {
    console.error('[TELEGRAM TEST ERROR]', err.message);
    res.status(500).json({ error: 'Failed to send test message', message: err.message });
  }
});

module.exports = router;
