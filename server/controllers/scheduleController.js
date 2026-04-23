// ============================================
// Schedule Controller — POST /api/schedule
// Saves prescription to Supabase, then sets
// a Google Calendar recurring reminder.
// ============================================

const supabase = require('../config/supabase');
const { createMedicationReminder } = require('../services/calendarService');

/**
 * POST /api/schedule
 * 
 * Expected body:
 * {
 *   userId:         "uuid",           // Supabase auth user ID
 *   medicationName: "Metformin",      // Drug name
 *   dosage:         "500mg",          // Dosage string
 *   frequency:      "three_times_daily", // Frequency label
 *   times:          ["08:30", "13:30", "20:30"], // Array of 24h time strings
 *   googleTokens: {                   // User's OAuth tokens (from frontend auth flow)
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

    // ---- 2. Save Prescription to Supabase ----
    let prescriptionId = null;
    let dbInsertSuccess = false;

    if (supabase) {
      // Insert into "prescriptions" table
      const { data, error: dbError } = await supabase
        .from('prescriptions')
        .insert({
          user_id: userId,
          drug_name: medicationName,
          dosage: dosage || null,
          frequency: frequency || 'custom',
          scheduled_times: times,          // Store as JSONB array
          reminder_status: 'PENDING',      // Will update to ACTIVE or FAILED
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) {
        console.error('[SCHEDULE] Supabase insert failed:', dbError.message);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to save prescription to database.',
          errorCode: 'DB_INSERT_FAILED',
          details: dbError.message,
        });
      }

      prescriptionId = data.id;
      dbInsertSuccess = true;
      console.log(`[SCHEDULE] ✅ Prescription saved to Supabase (ID: ${prescriptionId})`);
    } else {
      // Supabase not configured — mock mode for hackathon demo
      prescriptionId = `mock-${Date.now()}`;
      dbInsertSuccess = true;
      console.log(`[SCHEDULE] ⚠️ Supabase offline — using mock ID: ${prescriptionId}`);
    }

    // ---- 3. Create Google Calendar Events ----
    // One event per scheduled time (e.g., 3 events for TID medication)
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

    // ---- 4. Handle Partial Failures (Hackathon Error Strategy) ----
    // DB succeeded but some/all calendar events failed?
    // → Don't rollback the DB insert. Instead, flag it so we can retry later.
    const allCalendarFailed = calendarResults.length === 0 && calendarErrors.length > 0;
    const someCalendarFailed = calendarErrors.length > 0 && calendarResults.length > 0;

    if (supabase && prescriptionId && (allCalendarFailed || someCalendarFailed)) {
      // Update the prescription row with failure status + partial event IDs
      const eventIds = calendarResults.map(r => r.eventId);
      await supabase
        .from('prescriptions')
        .update({
          reminder_status: allCalendarFailed ? 'FAILED' : 'PARTIAL',
          calendar_event_ids: eventIds.length > 0 ? eventIds : null,
          reminder_error: calendarErrors.map(e => `${e.time}: ${e.error}`).join('; '),
        })
        .eq('id', prescriptionId);
    } else if (supabase && prescriptionId && calendarResults.length > 0) {
      // All calendar events created successfully — mark ACTIVE
      await supabase
        .from('prescriptions')
        .update({
          reminder_status: 'ACTIVE',
          calendar_event_ids: calendarResults.map(r => r.eventId),
        })
        .eq('id', prescriptionId);
    }

    // ---- 5. Build Response ----
    if (allCalendarFailed) {
      // DB saved, but NO reminders were set
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

    // Full or partial success
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
