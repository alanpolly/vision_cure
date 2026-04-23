const TelegramBot = require('node-telegram-bot-api');

// Initialize Telegram bot
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (token && token !== 'dummy') {
  bot = new TelegramBot(token, { polling: true });
  console.log('[TELEGRAM] Bot initialized and polling...');

  // Handle /start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMsg = "Welcome to VisionCure! You will now receive your medication reminders here. Please make sure your caregiver has registered your Telegram ID in the app.";
    bot.sendMessage(chatId, welcomeMsg);
  });
} else {
  console.warn('[TELEGRAM] No token found. Bot disabled.');
}

/**
 * Send a message to a specific Telegram ID
 * @param {string} telegramId 
 * @param {string} message 
 */
async function sendMessage(telegramId, message) {
  if (!bot) return;
  try {
    await bot.sendMessage(telegramId, message);
    console.log(`[TELEGRAM] Message sent to ${telegramId}`);
  } catch (err) {
    console.error(`[TELEGRAM ERROR] Failed to send message to ${telegramId}:`, err.message);
  }
}

module.exports = {
  bot,
  sendMessage
};
