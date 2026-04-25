// ============================================
// Schedule Controller — POST /api/schedule
// Saves prescription to MongoDB, then sets
// a Google Calendar recurring reminder.
// ============================================

const MedicationSchedule = require('../models/MedicationSchedule');
const { createMedicationReminder } = require('../services/calendarService');

/**
 * POST /api/schedule
 * 
 * Expected body:
 * {
 *   userId:         "uuid",           // Auth user ID
 *   medicationName: "Metformin",      // Drug name
 *   dosage:         "500mg",          // Dosage string
 *   frequency:      "three_times_daily", // Frequency label
 *   times:          ["08:30", "13:30", "20:30"], // Array of 24h time strings
 *   googleTokens: {                   // User's OAuth tokens
 *     access_token:  "ya29...",
 *     refresh_token: "1//0e..."
 *   }
 * }
 */
async function scheduleMedication(req, res) {
  try {
    const { userId, medicationName, dosage, frequency, times, googleTokens } = req.body;

    // ---- 1. Input Validation ----
    if (!userId || !medicationName || !times || !Array.isArray(times) || times.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userId, medicationName, and times[] are required.',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    if (!googleTokens || !googleTokens.access_token) {
      return res.status(401).json({
        status: 'error',
        message: 'Google OAuth tokens are required to set calendar reminders. Please sign in with Google.',
        errorCode: 'MISSING_GOOGLE_AUTH',
      });
    }

    console.log(`[SCHEDULE] New request: ${medicationName} ${dosage || ''} for user ${userId}`);
    console.log(`[SCHEDULE] Times: ${times.join(', ')} | Frequency: ${frequency || 'custom'}`);

    // ---- 2. Save Prescription to MongoDB ----
    let prescriptionId = null;
    let dbInsertSuccess = false;

    try {
      const newSchedule = await MedicationSchedule.create({
        userId,
        name: medicationName,
        dosage: dosage || 'Not specified',
        frequency: frequency || 'custom',
        duration: 'ongoing',
        times,
        status: 'PENDING'
      });
      prescriptionId = newSchedule._id.toString();
      dbInsertSuccess = true;
      console.log(`[SCHEDULE] ✅ Prescription saved to MongoDB (ID: ${prescriptionId})`);
    } catch (dbError) {
      console.error('[SCHEDULE] MongoDB insert failed:', dbError.message);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save prescription to database.',
        errorCode: 'DB_INSERT_FAILED',
        details: dbError.message,
      });
    }

    // ---- 3. Create Google Calendar Events ----
    const calendarResults = [];
    const calendarErrors = [];
    const displayName = `${medicationName}${dosage ? ' ' + dosage : ''}`;

    for (const time of times) {
      try {
        const result = await createMedicationReminder(
          googleTokens,
          displayName,
          time,
          { description: `VisionCure Rx: ${displayName}\nFrequency: ${frequency || 'daily'}\nPrescription ID: ${prescriptionId}` }
        );
        calendarResults.push(result);
        console.log(`[SCHEDULE] ✅ Calendar event created for ${time}`);
      } catch (calErr) {
        console.error(`[SCHEDULE] ❌ Calendar event failed for ${time}:`, calErr.message);
        calendarErrors.push({ time, error: calErr.message });
      }
    }

    // ---- 4. Handle Partial Failures ----
    const allCalendarFailed = calendarResults.length === 0 && calendarErrors.length > 0;
    const someCalendarFailed = calendarErrors.length > 0 && calendarResults.length > 0;

    if (dbInsertSuccess && prescriptionId && (allCalendarFailed || someCalendarFailed)) {
      await MedicationSchedule.findByIdAndUpdate(prescriptionId, {
        status: allCalendarFailed ? 'FAILED' : 'PARTIAL',
        // In real app, might want to save calendar_event_ids here too, but model doesn't have it
      });
    } else if (dbInsertSuccess && prescriptionId && calendarResults.length > 0) {
      await MedicationSchedule.findByIdAndUpdate(prescriptionId, {
        status: 'ACTIVE'
      });
    }

    // ---- 5. Build Response ----
    if (allCalendarFailed) {
      return res.status(207).json({
        status: 'partial_success',
        message: `Prescription saved, but Google Calendar reminders failed. You can retry from your profile.`,
        prescriptionId,
        dbSaved: true,
        reminders: [],
        errors: calendarErrors,
        errorCode: 'CALENDAR_FAILED',
      });
    }

    return res.status(201).json({
      status: someCalendarFailed ? 'partial_success' : 'success',
      message: someCalendarFailed
        ? `Prescription saved. ${calendarResults.length}/${times.length} reminders set. Some failed — check errors.`
        : `Prescription saved and ${calendarResults.length} daily reminder(s) set on Google Calendar.`,
      prescriptionId,
      dbSaved: true,
      reminders: calendarResults,
      errors: someCalendarFailed ? calendarErrors : [],
    });

  } catch (error) {
    console.error('[SCHEDULE] Unexpected error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong while scheduling the medication.',
      errorCode: 'INTERNAL_ERROR',
      details: error.message,
    });
  }
}

module.exports = { scheduleMedication };
