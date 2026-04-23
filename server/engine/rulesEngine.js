// ============================================
// Rules Engine
// Priority cascade: Contraindication → Schedule → Dosage
// Short-circuits at the first triggered rule.
// ============================================

/**
 * Main evaluation function. Runs all checks in priority order.
 *
 * @param {Object} detectedDrug - { name, dosage, form, confidence }
 * @param {Array}  activeMeds   - [{ drug_name, dosage, form }]
 * @param {Array}  rules        - [{ drug_a, drug_b, severity, reason, source }]
 * @param {Array}  schedules    - [{ drug_name, dosage, time_of_day, taken }]
 * @returns {Object} { arState, message, contraindications, schedule }
 */
function evaluate(detectedDrug, activeMeds, rules, schedules) {
  // ---- Priority 1: Contraindication Check ----
  const contraResult = checkContraindications(detectedDrug, activeMeds, rules);
  if (contraResult.hasConflict) {
    const topConflict = contraResult.conflicts[0];
    return {
      arState: 'CONTRAINDICATION',
      status: 'warning',
      message: `⚠ CONTRAINDICATION: ${detectedDrug.name} conflicts with your active prescription ${topConflict.conflictsWith}. ${topConflict.reason}`,
      contraindications: contraResult.conflicts,
      schedule: null
    };
  }

  // ---- Priority 2: Schedule Check ----
  const schedResult = checkSchedule(detectedDrug, schedules);
  if (!schedResult.isScheduled) {
    return {
      arState: 'UNKNOWN_DRUG',
      status: 'info',
      message: `${detectedDrug.name} is not in your active medication list.`,
      contraindications: [],
      schedule: null
    };
  }

  if (!schedResult.isWithinWindow) {
    return {
      arState: 'NOT_SCHEDULED',
      status: 'info',
      message: `${detectedDrug.name} ${detectedDrug.dosage} is not scheduled until ${schedResult.scheduledTime}.`,
      contraindications: [],
      schedule: {
        scheduledTime: schedResult.scheduledTime,
        window: schedResult.window,
        isWithinWindow: false
      }
    };
  }

  if (schedResult.alreadyTaken) {
    return {
      arState: 'ALREADY_TAKEN',
      status: 'info',
      message: `${detectedDrug.name} ${detectedDrug.dosage} has already been taken for this time slot.`,
      contraindications: [],
      schedule: {
        scheduledTime: schedResult.scheduledTime,
        window: schedResult.window,
        isWithinWindow: true
      }
    };
  }

  // ---- Priority 3: Dosage Verification ----
  const dosageResult = checkDosage(detectedDrug.dosage, schedResult.prescribedDosage);
  if (!dosageResult.isCorrect) {
    return {
      arState: 'WRONG_DOSAGE',
      status: 'warning',
      message: `Dosage mismatch: detected ${dosageResult.detected}, but prescribed ${dosageResult.prescribed}.`,
      contraindications: [],
      schedule: {
        scheduledTime: schedResult.scheduledTime,
        window: schedResult.window,
        isWithinWindow: true
      }
    };
  }

  // ---- All checks passed → TAKE_NOW ----
  return {
    arState: 'TAKE_NOW',
    status: 'success',
    message: `${detectedDrug.name} ${detectedDrug.dosage} — scheduled now. Safe to take.`,
    contraindications: [],
    schedule: {
      scheduledTime: schedResult.scheduledTime,
      window: schedResult.window,
      isWithinWindow: true
    }
  };
}

/**
 * Checks detected drug against all active medications for contraindications.
 *
 * @param {Object} detectedDrug - { name }
 * @param {Array}  activeMeds   - [{ drug_name }]
 * @param {Array}  rules        - [{ drug_a, drug_b, severity, reason, source }]
 * @returns {Object} { hasConflict, conflicts[] }
 */
function checkContraindications(detectedDrug, activeMeds, rules) {
  const detected = detectedDrug.name.toLowerCase();
  const conflicts = [];

  for (const med of activeMeds) {
    const active = med.drug_name.toLowerCase();

    // Don't check a drug against itself
    if (detected === active) continue;

    // Find matching rules (bidirectional)
    for (const rule of rules) {
      const a = rule.drug_a.toLowerCase();
      const b = rule.drug_b.toLowerCase();

      const isMatch =
        (a === detected && b === active) ||
        (a === active && b === detected);

      if (isMatch) {
        conflicts.push({
          severity: rule.severity,
          conflictsWith: med.drug_name,
          reason: rule.reason,
          source: rule.source || 'Unknown'
        });
      }
    }
  }

  // Sort: high > medium > low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  conflicts.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

/**
 * Checks if the detected drug is scheduled and within the ±30 min window.
 *
 * @param {Object} detectedDrug - { name }
 * @param {Array}  schedules    - [{ drug_name, dosage, time_of_day, taken }]
 * @returns {Object} { isScheduled, isWithinWindow, alreadyTaken, scheduledTime, window, prescribedDosage }
 */
function checkSchedule(detectedDrug, schedules) {
  const detected = detectedDrug.name.toLowerCase();

  // Find all schedule entries for this drug
  const drugSchedules = schedules.filter(
    s => s.drug_name.toLowerCase() === detected
  );

  if (drugSchedules.length === 0) {
    return { isScheduled: false, isWithinWindow: false, alreadyTaken: false, scheduledTime: null, window: null, prescribedDosage: null };
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const WINDOW_MINUTES = 30; // ±30 minutes

  // Find the closest scheduled time
  let closest = null;
  let closestDiff = Infinity;

  for (const entry of drugSchedules) {
    const [h, m] = entry.time_of_day.split(':').map(Number);
    const schedMinutes = h * 60 + m;
    const diff = Math.abs(nowMinutes - schedMinutes);

    if (diff < closestDiff) {
      closestDiff = diff;
      closest = entry;
    }
  }

  const [ch, cm] = closest.time_of_day.split(':').map(Number);
  const schedMinutes = ch * 60 + cm;
  const windowStart = schedMinutes - WINDOW_MINUTES;
  const windowEnd = schedMinutes + WINDOW_MINUTES;
  const isWithinWindow = nowMinutes >= windowStart && nowMinutes <= windowEnd;

  // Format the window string
  const fmtTime = (mins) => {
    const hh = Math.floor(mins / 60).toString().padStart(2, '0');
    const mm = (mins % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return {
    isScheduled: true,
    isWithinWindow,
    alreadyTaken: closest.taken === true,
    scheduledTime: closest.time_of_day,
    window: `${fmtTime(Math.max(0, windowStart))}–${fmtTime(Math.min(1439, windowEnd))}`,
    prescribedDosage: closest.dosage
  };
}

/**
 * Compares detected dosage against prescribed dosage.
 *
 * @param {string} detectedDosage   - e.g., "500mg"
 * @param {string} prescribedDosage - e.g., "500mg"
 * @returns {Object} { isCorrect, detected, prescribed }
 */
function checkDosage(detectedDosage, prescribedDosage) {
  if (!detectedDosage || detectedDosage === 'unknown' || !prescribedDosage) {
    // If we can't determine dosage, don't block — pass through
    return { isCorrect: true, detected: detectedDosage, prescribed: prescribedDosage };
  }

  const normalize = (d) => d.toLowerCase().replace(/\s+/g, '');
  const isCorrect = normalize(detectedDosage) === normalize(prescribedDosage);

  return {
    isCorrect,
    detected: detectedDosage,
    prescribed: prescribedDosage
  };
}

module.exports = { evaluate, checkContraindications, checkSchedule, checkDosage };
