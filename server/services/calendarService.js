// ============================================
// Google Calendar Service — Medication Reminders
// Creates recurring daily events via OAuth 2.0
// ============================================

const { google } = require('googleapis');

/**
 * Create a Google Calendar OAuth2 client from the user's stored tokens.
 * 
 * @param {Object} tokens - { access_token, refresh_token, expiry_date }
 * @returns {google.auth.OAuth2} Authenticated OAuth2 client
 */
function buildAuthClient(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || null,
  });

  return oauth2Client;
}

/**
 * Create a recurring daily medication reminder on the user's Google Calendar.
 * 
 * @param {Object} tokens       - User's OAuth tokens { access_token, refresh_token }
 * @param {string} medicationName - e.g. "Metformin 500mg"
 * @param {string} timeStr       - 24h time string, e.g. "08:30"
 * @param {Object} [options]     - Optional overrides
 * @param {string} [options.timeZone]    - IANA timezone (default: Asia/Kolkata)
 * @param {string} [options.description] - Custom event description
 * @param {string} [options.colorId]     - Google Calendar color ID (1-11)
 * @returns {Object} Created event data from Google Calendar API
 */
async function createMedicationReminder(tokens, medicationName, timeStr, options = {}) {
  const {
    timeZone = 'Asia/Kolkata',
    description = null,
    colorId = '11', // Tomato red — stands out for medication
  } = options;

  // ---- Build authenticated client ----
  const auth = buildAuthClient(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  // ---- Parse the time into a proper start/end DateTime ----
  // We create the event starting "today" — RRULE handles recurrence
  const today = new Date().toISOString().split('T')[0]; // "2026-04-01"
  const [hours, minutes] = timeStr.split(':');
  const startDateTime = `${today}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;

  // End time = start + 5 minutes (just a nudge event, not a long block)
  const endHour = parseInt(hours);
  const endMin = parseInt(minutes) + 5;
  const endDateTime = `${today}T${String(endHour + Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00`;

  // ---- Build the calendar event payload ----
  const event = {
    summary: `💊 Take ${medicationName}`,
    description: description || `VisionCure Reminder: Time to take your ${medicationName}.\n\nThis is an automated daily reminder from the VisionCure app.`,
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
    // Recur every day, indefinitely (user can cancel from app later)
    recurrence: ['RRULE:FREQ=DAILY'],
    // 10-minute prior pop-up notification — the core feature
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10 },
      ],
    },
    colorId,
    // Tag it so we can find/delete VisionCure events later
    extendedProperties: {
      private: {
        createdBy: 'visioncure',
        medicationName: medicationName,
      },
    },
  };

  // ---- Insert the event ----
  console.log(`[CALENDAR] Creating daily reminder for "${medicationName}" at ${timeStr} (${timeZone})`);

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  console.log(`[CALENDAR] ✅ Event created: ${response.data.htmlLink}`);

  return {
    eventId: response.data.id,
    htmlLink: response.data.htmlLink,
    summary: response.data.summary,
    startTime: timeStr,
    recurrence: 'DAILY',
  };
}

/**
 * Delete a VisionCure medication event from the user's calendar.
 * Useful for when a prescription is discontinued.
 * 
 * @param {Object} tokens  - User's OAuth tokens
 * @param {string} eventId - Google Calendar event ID to delete
 */
async function deleteMedicationReminder(tokens, eventId) {
  const auth = buildAuthClient(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });

  console.log(`[CALENDAR] 🗑️ Deleted event: ${eventId}`);
}

module.exports = {
  createMedicationReminder,
  deleteMedicationReminder,
};
