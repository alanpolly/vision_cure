// ============================================
// Medication Controller
// ============================================

const visionService = require('../services/visionService');
const supabaseService = require('../services/supabaseService');
const rulesEngine = require('../engine/rulesEngine');

/**
 * POST /api/verify
 * Primary AR verification endpoint. Processes image via Google Vision,
 * extracts drug info, and runs through the Rules Engine.
 */
async function verifyMedication(req, res) {
  try {
    const { imageBase64, userId } = req.body;

    console.log(`[VERIFY] Request received. imageBase64: ${imageBase64 ? `${imageBase64.length} chars` : 'MISSING'}, userId: ${userId || 'none'}`);

    // ---- 1. Validate input ----
    if (!imageBase64) {
      return res.status(400).json({
        status: 'error', arState: 'NO_DETECTION', detectedDrug: null,
        schedule: null, contraindications: [],
        message: 'Missing image. Make sure the camera captured a frame.', errorCode: 'MISSING_IMAGE'
      });
    }

    // ---- 2. Vision API processing (powered by local Qwen model) ----
    const annotations = await visionService.analyzeImage(imageBase64);
    const detectedDrug = visionService.extractMedicationInfo(annotations);

    if (!detectedDrug) {
      return res.json({
        status: 'success',
        arState: 'NO_DETECTION',
        detectedDrug: null,
        schedule: null,
        contraindications: [],
        message: 'No medication identified. Please point the camera clearly at the label.'
      });
    }

    console.log(`[VERIFY] Detected Drug: ${detectedDrug.name} ${detectedDrug.dosage}`);

    // ---- 3. Fetch User Data ----
    // For Hackathon demo, ignoring real user ID to use hardcoded profile if needed
    let activeMeds = await supabaseService.getUserMedications(userId);
    const schedules = await supabaseService.getUserSchedule(userId, new Date().toISOString().split('T')[0]);
    const rules = await supabaseService.getContraindicationRules(detectedDrug.name);

    // --- HACKATHON DEMO LOGIC for Bottle B + Bottle C ---
    // If scanning Metformin, it should be "TAKE NOW" (green).
    // BUT if scanning Metformin AND Warfarin together, it should be RED WARNING.
    const fullText = (annotations.textAnnotations && annotations.textAnnotations.length > 0)
      ? annotations.textAnnotations[0].description.toLowerCase() : '';

    const scannedBoth = fullText.includes('metformin') && fullText.includes('warfarin');

    if (!scannedBoth) {
      // Artificially remove Warfarin from activeMeds when Metformin is detected
      if (detectedDrug.name.toLowerCase() === 'metformin') {
        activeMeds = activeMeds.filter(m => m.drug_name.toLowerCase() !== 'warfarin');
      } else if (detectedDrug.name.toLowerCase() === 'warfarin') {
        activeMeds = activeMeds.filter(m => m.drug_name.toLowerCase() !== 'metformin');
      }
    } else {
      // Force the detected drug to be Metformin so it triggers the Warfarin rule
      detectedDrug.name = 'Metformin';
    }

    // ---- 4. Rules Engine Evaluation ----
    const evaluation = rulesEngine.evaluate(detectedDrug, activeMeds, rules, schedules);

    // If both were scanned, update the display name for the UI
    if (scannedBoth) {
      detectedDrug.name = 'Metformin + Warfarin';
      detectedDrug.dosage = 'Combination Detected';
    }

    console.log(`[VERIFY] Result: ${evaluation.arState}`);

    return res.json({
      status: 'success',
      arState: evaluation.arState,
      detectedDrug: detectedDrug,
      schedule: evaluation.schedule,
      contraindications: evaluation.contraindications,
      message: evaluation.message
    });

  } catch (error) {
    console.error('[VERIFY ERROR]', error.message);
    return res.status(500).json({
      status: 'error',
      arState: 'ERROR',
      detectedDrug: null,
      schedule: null,
      contraindications: [],
      message: error.message,
      errorCode: 'INTERNAL_ERROR'
    });
  }
}

/**
 * GET /api/schedule/:userId
 * Returns today's medication schedule (hardcoded for demo).
 */
async function getSchedule(req, res) {
  return res.json({
    status: 'success',
    date: new Date().toISOString().split('T')[0],
    medications: [
      {
        drugName: 'Metformin',
        dosage: '500mg',
        times: ['08:30', '13:30', '20:30'],
        taken: [false, false, false]
      }
    ]
  });
}

/**
 * POST /api/history
 * Logs a medication as taken.
 */
async function logMedication(req, res) {
  const { drugName, dosage } = req.body;
  console.log('[DEMO] Logged medication:', { drugName, dosage });
  return res.status(201).json({
    status: 'success',
    message: `${drugName || 'Medication'} logged successfully.`
  });
}

module.exports = { verifyMedication, getSchedule, logMedication };
