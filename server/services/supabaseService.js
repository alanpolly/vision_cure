// ============================================
// Supabase Data Access Service
// HARDCODED for hackathon demo — 3 medicine bottles
// ============================================

const supabase = require('../config/supabase');

// ---- HARDCODED DEMO MEDICATIONS ----
// Bottle A: Amlodipine 5mg — morning only
// Bottle B: Metformin 500mg — three times daily (always TAKE NOW in demo)
// Bottle C: Warfarin 2mg — evening only

function getUserMedications(userId) {
  return Promise.resolve([
    { id: 'med-a', drug_name: 'Amlodipine', dosage: '5mg', form: 'tablet', is_active: true },
    { id: 'med-b', drug_name: 'Metformin', dosage: '500mg', form: 'tablet', is_active: true },
    { id: 'med-c', drug_name: 'Warfarin', dosage: '2mg', form: 'tablet', is_active: true }
  ]);
}

function getUserSchedule(userId, todayStr) {
  // Dynamic schedule: always make Metformin "due now" for one of the doses
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  // Round current time to nearest 30 min for a clean display
  const nearestMin = currentMin < 30 ? '00' : '30';
  const metforminNowTime = `${currentHour.toString().padStart(2, '0')}:${nearestMin}`;

  return Promise.resolve([
    // Bottle A — Amlodipine: morning only, e.g. 08:00
    // Real use: taken once daily in the morning
    { drug_name: 'Amlodipine', dosage: '5mg', time_of_day: '08:00', taken: false },

    // Bottle B — Metformin: 3x daily 
    // We add 12:00, 20:00 as fixed times, and a dynamic 'now' time so scanning it says TAKE NOW
    { drug_name: 'Metformin', dosage: '500mg', time_of_day: metforminNowTime, taken: false },
    { drug_name: 'Metformin', dosage: '500mg', time_of_day: '12:00', taken: false },
    { drug_name: 'Metformin', dosage: '500mg', time_of_day: '20:00', taken: false },

    // Bottle C — Warfarin: evening only, e.g. 21:00
    // Real use: taken once daily in the evening
    { drug_name: 'Warfarin', dosage: '2mg', time_of_day: '21:00', taken: false }
  ]);
}

function getContraindicationRules(drugName) {
  const allRules = [
    // Dangerous combination: Bottle B + Bottle C together = RED WARNING
    { drug_a: 'metformin', drug_b: 'warfarin', severity: 'high', reason: 'Metformin increases the blood thinning effect of Warfarin, which can cause serious internal bleeding.', source: 'FDA' },
    
    // Warfarin interactions
    { drug_a: 'warfarin', drug_b: 'ibuprofen', severity: 'high', reason: 'NSAIDs dramatically increase bleeding risk with anticoagulants. Can cause fatal internal bleeding.', source: 'FDA' },
    { drug_a: 'warfarin', drug_b: 'aspirin', severity: 'high', reason: 'Aspirin + Warfarin greatly increases risk of uncontrolled bleeding.', source: 'FDA' },

    // Amlodipine interactions
    { drug_a: 'amlodipine', drug_b: 'simvastatin', severity: 'medium', reason: 'Amlodipine increases simvastatin levels, raising risk of muscle damage.', source: 'FDA' }
  ];

  const name = drugName.toLowerCase().trim();
  return Promise.resolve(allRules.filter(r => r.drug_a === name || r.drug_b === name));
}

function logMedicationTaken(userId, drugName, dosage, takenAt, verifiedBy = 'vision_scan') {
  console.log('[DEMO] Logged medication:', { drugName, dosage, takenAt });
  return Promise.resolve({ id: 'demo-log-id' });
}

module.exports = {
  getUserMedications,
  getUserSchedule,
  getContraindicationRules,
  logMedicationTaken
};
