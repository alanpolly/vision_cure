const supabase = require('../config/supabase');
const { sendMessage, bot } = require('./telegramBot');

// In-memory store for tracking acknowledgments (for demo purposes)
// Format: { chatId_medName_time: { userId, medName, dosage, scheduledTime, startTime, reminded15: false, reminded30: false } }
const pendingAcks = {};

/**
 * Starts the reminder scheduler loop
 */
function startScheduler() {
  console.log('[SCHEDULER] Medication reminder scheduler started.');
  
  // 1. Run every 60 seconds
  setInterval(async () => {
    await checkAndSendReminders();
    await handleEscalations();
  }, 60000);

  // 2. Listen for Telegram replies
  if (bot) {
    bot.on('message', async (msg) => {
      const text = msg.text?.toUpperCase();
      const chatId = msg.chat.id.toString();

      if (text === 'TAKEN') {
        await handleTakenAcknowledgment(chatId);
      }
    });
  }
}

/**
 * Checks for medications due in the current minute
 */
async function checkAndSendReminders() {
  if (!supabase) return;

  try {
    const now = new Date();
    const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Fetch meds joined with user profiles to get telegram_id
    // We filter by times array containing the current HH:MM
    const { data: medications, error } = await supabase
      .from('medication_schedule')
      .select('*, user_profiles(telegram_id)')
      .filter('times', 'cs', `{"${currentHHMM}"}`);

    if (error) throw error;
    if (!medications || medications.length === 0) return;

    for (const med of medications) {
      const telegramId = med.user_profiles?.telegram_id;
      if (!telegramId) continue;

      const message = `Time to take your ${med.name} ${med.dosage}! This is your VisionCure medication reminder. Please confirm you have taken it by replying TAKEN.`;
      await sendMessage(telegramId, message);

      // Track for acknowledgment
      const ackKey = `${telegramId}_${med.name}_${currentHHMM}`;
      pendingAcks[ackKey] = {
        userId: med.userId,
        medName: med.name,
        dosage: med.dosage,
        scheduledTime: currentHHMM,
        startTime: Date.now(),
        reminded15: false,
        reminded30: false,
        chatId: telegramId
      };

      // Log as PENDING in DB
      await supabase.from('medication_logs').insert({
        user_id: med.userId,
        medicine_name: med.name,
        scheduled_time: currentHHMM,
        status: 'PENDING'
      });
    }
  } catch (err) {
    console.error('[SCHEDULER ERROR] Failed to check reminders:', err.message);
  }
}

/**
 * Handles "TAKEN" reply from Telegram
 */
async function handleTakenAcknowledgment(chatId) {
  // Find all pending acks for this user
  const keys = Object.keys(pendingAcks).filter(k => pendingAcks[k].chatId === chatId);
  
  if (keys.length === 0) {
    await sendMessage(chatId, "You have no pending medication reminders.");
    return;
  }

  for (const key of keys) {
    const ack = pendingAcks[key];
    
    // Update DB
    await supabase.from('medication_logs')
      .update({ status: 'TAKEN', taken_at: new Date().toISOString() })
      .match({ user_id: ack.userId, medicine_name: ack.medName, scheduled_time: ack.scheduledTime, status: 'PENDING' });

    // Remove from memory
    delete pendingAcks[key];
  }

  await sendMessage(chatId, "Great! I've logged your medication as taken. Keep it up!");
}

/**
 * Handles escalation for missed doses (15m, 30m)
 */
async function handleEscalations() {
  const now = Date.now();
  
  for (const key in pendingAcks) {
    const ack = pendingAcks[key];
    const elapsedMins = (now - ack.startTime) / 60000;

    // 15 Minute Follow-up
    if (elapsedMins >= 15 && !ack.reminded15) {
      await sendMessage(ack.chatId, `You have not confirmed your medication. Please take ${ack.medName} now and reply TAKEN.`);
      ack.reminded15 = true;
    }

    // 30 Minute SOS
    if (elapsedMins >= 30 && !ack.reminded30) {
      await sendMessage(ack.chatId, `ALERT: Medication missed. Your caregiver has been notified.`);
      ack.reminded30 = true;
      
      // Update status to MISSED
      await supabase.from('medication_logs')
        .update({ status: 'MISSED' })
        .match({ user_id: ack.userId, medicine_name: ack.medName, scheduled_time: ack.scheduledTime, status: 'PENDING' });

      // Trigger SOS (Simulated)
      await triggerSOS(ack.userId, ack.medName);

      // Remove from memory
      delete pendingAcks[key];
    }
  }
}

/**
 * Trigger SOS / Emergency notification
 */
async function triggerSOS(userId, medName) {
  console.error(`[SOS ALERT] User ${userId} MISSED MEDICATION: ${medName}. Triggering caregiver alert.`);
  
  // In a real app, this would call Twilio or a similar service.
  // We'll log it as a critical event.
  if (supabase) {
    const { data: profile } = await supabase.from('user_profiles').select('caregiver_phone').eq('user_id', userId).single();
    if (profile?.caregiver_phone) {
      console.log(`[SOS] Notifying caregiver at ${profile.caregiver_phone}`);
    }
  }
}

module.exports = { startScheduler };
