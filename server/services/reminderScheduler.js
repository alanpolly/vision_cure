const User = require('../models/User');
const MedicationSchedule = require('../models/MedicationSchedule');
const MedicationLog = require('../models/MedicationLog');
const { sendMessage, bot } = require('./telegramBot');

// In-memory store for tracking acknowledgments (for demo purposes)
// Format: { chatId_medName_time: { userId, medName, dosage, scheduledTime, startTime, reminded15: false, reminded30: false, chatId } }
const pendingAcks = {};

/**
 * Starts the reminder scheduler loop
 */
function startScheduler() {
  console.log('[SCHEDULER] Medication reminder scheduler started (MongoDB linked).');
  
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
  try {
    const now = new Date();
    // Use local time for HH:MM comparison since the server and user are expected to be in same timezone for this MVP
    const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Fetch all medications scheduled for this exact time
    const medications = await MedicationSchedule.find({ times: currentHHMM });
    if (!medications || medications.length === 0) return;

    for (const med of medications) {
      // Find the user to get their telegramId
      const user = await User.findById(med.userId);
      if (!user || !user.telegramId) continue;

      const telegramId = user.telegramId;
      const message = `Time to take your ${med.name} ${med.dosage}! This is your VisionCure medication reminder.\n\nPlease confirm you have taken it by replying TAKEN.`;
      
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

      // Log as PENDING in MongoDB
      await MedicationLog.create({
        userId: med.userId,
        medicineName: med.name,
        scheduledTime: currentHHMM,
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
  // Find all pending acks for this chat ID
  const keys = Object.keys(pendingAcks).filter(k => pendingAcks[k].chatId === chatId);
  
  if (keys.length === 0) {
    await sendMessage(chatId, "You have no pending medication reminders.");
    return;
  }

  for (const key of keys) {
    const ack = pendingAcks[key];
    
    // Update DB
    await MedicationLog.findOneAndUpdate(
      { userId: ack.userId, medicineName: ack.medName, scheduledTime: ack.scheduledTime, status: 'PENDING' },
      { status: 'TAKEN', takenAt: new Date() }
    );

    // Remove from memory
    delete pendingAcks[key];
  }

  await sendMessage(chatId, "Great! I've logged your medication as taken. Keep it up! ✅");
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
      await sendMessage(ack.chatId, `⚠️ Reminder: You have not confirmed your medication. Please take ${ack.medName} now and reply TAKEN.`);
      ack.reminded15 = true;
    }

    // 30 Minute SOS
    if (elapsedMins >= 30 && !ack.reminded30) {
      await sendMessage(ack.chatId, `🚨 ALERT: Medication missed. Your caregiver has been notified.`);
      ack.reminded30 = true;
      
      // Update status to MISSED
      await MedicationLog.findOneAndUpdate(
        { userId: ack.userId, medicineName: ack.medName, scheduledTime: ack.scheduledTime, status: 'PENDING' },
        { status: 'MISSED' }
      );

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
  
  try {
    const user = await User.findById(userId);
    if (user && user.caregiverPhone) {
      console.log(`[SOS] 📞 Notifying caregiver at ${user.caregiverPhone}`);
    }
  } catch (err) {
    console.error('[SOS ERROR]', err.message);
  }
}

module.exports = { startScheduler };
