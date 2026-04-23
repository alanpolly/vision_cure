const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

/**
 * POST /api/user/profile
 * Upserts a user's profile information (Telegram ID, Caregiver Phone)
 */
router.post('/profile', async (req, res) => {
  const { userId, telegramId, caregiverPhone } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  if (!supabase) {
    console.warn('[USER PROFILE] Running in MOCK mode — profile not persisted.');
    return res.json({ success: true, message: 'Profile updated (MOCK MODE)' });
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ 
        user_id: userId, 
        telegram_id: telegramId,
        caregiver_phone: caregiverPhone
      }, { onConflict: 'user_id' });

    if (error) throw error;

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('[USER PROFILE ERROR]', err.message);
    res.status(500).json({ error: 'Failed to update profile', message: err.message });
  }
});

/**
 * GET /api/user/profile/:userId
 * Fetches a user's profile information
 */
router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!supabase) {
    return res.json({ profile: { telegram_id: '@AchyuthCV', caregiver_phone: '8105219623' } });
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

    res.json({ profile: data || null });
  } catch (err) {
    console.error('[USER PROFILE FETCH ERROR]', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
