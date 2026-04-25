// ============================================
// API Routes
// ============================================

const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const MedicationSchedule = require('../models/MedicationSchedule');
const {
  verifyMedication,
  getSchedule,
  logMedication
} = require('../controllers/medicationController');
const { scheduleMedication } = require('../controllers/scheduleController');
const { testVisionConnection } = require('../services/visionService');
const { askQuestion } = require('../controllers/chatController');
const {
  transcribe,
  speak
} = require('../controllers/voiceController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/verify — Primary AR verification endpoint
router.post('/verify', verifyMedication);

// POST /api/chat — Conversational Voice Assistant Q&A
router.post('/chat', askQuestion);

// POST /api/voice/transcribe — Audio transcription via Groq Whisper
router.post('/voice/transcribe', upload.single('audio'), transcribe);

// POST /api/voice/speak — Text-to-speech via ElevenLabs
router.post('/voice/speak', speak);

// GET /api/schedule/:userId — Today's medication schedule
router.get('/schedule/:userId', getSchedule);

// POST /api/schedule — Save prescription + create Google Calendar reminders
router.post('/schedule', scheduleMedication);

// POST /api/history — Log a taken medication
router.post('/history', logMedication);

// GET /api/vision-test — Test if Google Vision API is connected
router.get('/vision-test', async (req, res) => {
  try {
    const result = await testVisionConnection();
    res.json({
      status: result.connected ? 'ok' : 'error',
      ...result
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      connected: false,
      message: err.message
    });
  }
});

/**
 * Internal helper to check interactions using Gemini
 */
async function checkInteractionsInternal(userId, newMeds = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'dummy') return [];

  let allMeds = await MedicationSchedule.find({ userId }).lean();

  const medNames = new Set(allMeds.map(m => m.name.toLowerCase()));
  newMeds.forEach(m => {
    if (!medNames.has(m.name.toLowerCase())) {
      allMeds.push(m);
      medNames.add(m.name.toLowerCase());
    }
  });

  if (allMeds.length < 2) return [];

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const medListString = allMeds.map(m => `${m.name} (${m.dosage})`).join(', ');
  
  const prompt = `You are a clinical pharmacist. Given these medications that a patient is currently taking, identify ALL dangerous drug interactions, contraindications, and dietary conflicts.
Medications: ${medListString}

For each interaction found return a JSON array where each object has:
- drug1, drug2, severity (HIGH, MEDIUM, or LOW), description (simple non-technical), action.
If no interactions found return an empty array [].
Return ONLY valid JSON array. No markdown.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Robust cleaning: Find first [ and last ]
    let cleaned = responseText.trim();
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
    
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[GEMINI INTERACTION ERROR]', err.message);
    return [];
  }
}

// POST /api/check-interactions
router.post('/check-interactions', async (req, res) => {
  const userId = req.body.userId ? String(req.body.userId) : null;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const interactions = await checkInteractionsInternal(userId);
    res.json({ interactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check interactions', message: err.message });
  }
});

module.exports = router;
