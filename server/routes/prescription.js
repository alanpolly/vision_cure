const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const MedicationSchedule = require('../models/MedicationSchedule');
const supabase = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/prescription/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const apiKey = process.env.GEMINI_API_KEY;
    let data;
    
    if (!apiKey || apiKey === 'dummy') {
      console.warn('[VISION] Using mock prescription data for demo/fallback.');
      data = {
        medications: [
          { name: "Amlodipine", dosage: "5mg", times: ["08:00"], frequency: "Once daily", duration: "30 days" },
          { name: "Metformin", dosage: "500mg", times: ["08:00", "20:00"], frequency: "Twice daily", duration: "30 days" },
          { name: "Warfarin", dosage: "2mg", times: ["20:00"], frequency: "Once daily", duration: "30 days" }
        ]
      };
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const prompt = `Analyze this prescription image. Extract all medicine names, dosages, times in 24hr format, frequency, and duration.
Return the result strictly as a JSON object, specifically an array of objects under the key "medications".
No backticks, markdown, or other text. Only JSON.
Example format:
{
  "medications": [
    {
      "name": "Amoxicillin",
      "dosage": "500 mg",
      "times": ["08:00", "20:00"],
      "frequency": "Twice a day",
      "duration": "7 days"
    }
  ]
}`;

      const imagePart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      };

      try {
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        let cleaned = responseText.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\n/, '');
        if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\n?/, '');
        if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\n?```$/, '');
        cleaned = cleaned.trim();

        data = JSON.parse(cleaned);
      } catch (err) {
        console.error('[VISION] Gemini API call failed:', err.message);
        throw err; // Let the global handler catch it
      }
    }

    // Save to Supabase (and Fallback to MongoDB for compatibility)
    if (data.medications && data.medications.length > 0 && userId) {
      try {
        const inserts = data.medications.map(m => ({
          userId: userId,
          name: m.name || 'Unknown Medicine',
          dosage: m.dosage || 'As directed',
          times: m.times && m.times.length > 0 ? m.times : ['08:00'],
          frequency: m.frequency || 'As directed',
          duration: m.duration || 'Ongoing'
        }));

        // 1. Save to Supabase medication_schedule table
        if (supabase) {
          // Clear old schedule first
          await supabase.from('medication_schedule').delete().eq('userId', userId);
          const { error: sbError } = await supabase.from('medication_schedule').insert(inserts);
          if (sbError) console.error('[SUPABASE ERROR] Insert failed:', sbError.message);
          else console.log('[SUPABASE] Schedule updated.');
        }

        // 2. Keep MongoDB in sync (Optional, for backward compatibility)
        // 2. Keep MongoDB in sync
        for (const med of inserts) {
          await MedicationSchedule.updateOne(
            { userId: userId, name: med.name },
            { $set: med },
            { upsert: true }
          );
        }
        
      } catch(err) {
        console.warn("Could not save schedule to databases", err.message);
      }
    }

    // Automatically check for interactions
    let interactions = [];
    try {
      interactions = await checkInteractionsInternal(userId, data.medications);
    } catch (intErr) {
      console.error('[INTERACTION ERROR]', intErr.message);
    }

    // Include high severity interactions in response
    const highSeverityWarnings = interactions.filter(i => i.severity === 'HIGH');

    res.json({ 
      success: true, 
      medications: data.medications || [],
      interactions: interactions,
      hasHighSeverity: highSeverityWarnings.length > 0
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Failed to process prescription image", message: err.message });
  }
});

/**
 * Internal helper to check interactions using Gemini
 */
async function checkInteractionsInternal(userId, newMeds = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'dummy') return [];

  // 1. Get all medications (newly uploaded + existing ones)
  let allMeds = [];
  
  if (supabase) {
    const { data: existingMeds, error } = await supabase.from('medication_schedule').select('*').eq('userId', userId);
    if (!error && existingMeds) {
      allMeds = existingMeds;
    }
  } else {
    // Fallback to MongoDB if Supabase is not configured
    allMeds = await MedicationSchedule.find({ userId }).lean();
  }

  // Combine with new meds if any (avoid duplicates by name)
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
- drug1: Name of first drug
- drug2: Name of second drug
- severity: HIGH, MEDIUM, or LOW
- description: Simple non-technical English that an elderly person can understand
- action: What the user should do (e.g., "Call your doctor immediately", "Do not take these at the same time")

If no interactions found return an empty array [].
Return ONLY valid JSON array. No markdown, no backticks.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\n/, '');
    if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\n?/, '');
    if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\n?```$/, '');
    cleaned = cleaned.trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[GEMINI INTERACTION ERROR]', err.message);
    return [];
  }
}

// POST /api/prescription/check-interactions
router.post('/check-interactions', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const interactions = await checkInteractionsInternal(userId);
    res.json({ interactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check interactions', message: err.message });
  }
});

// GET /api/prescription/schedule
router.get('/schedule', async (req, res) => {
  const userId = req.query.userId || 'demo-user';

  try {
    let data = [];
    if (supabase) {
      const { data: sbData, error } = await supabase.from('medication_schedule').select('*').eq('userId', userId);
      if (!error && sbData) data = sbData;
    } else {
      data = await MedicationSchedule.find({ userId: userId }).lean();
    }
    
    res.json({ medications: data || [] });
  } catch (err) {
    console.error('Schedule fetch error', err);
    res.status(500).json({ error: 'Error fetching schedule' });
  }
});

// GET /api/prescription/now
router.get('/now', async (req, res) => {
  const userId = req.query.userId || 'demo-user';

  try {
    let data = [];
    if (supabase) {
      const { data: sbData, error } = await supabase.from('medication_schedule').select('*').eq('userId', userId);
      if (!error && sbData) data = sbData;
    } else {
      data = await MedicationSchedule.find({ userId: userId }).lean();
    }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const dueNow = (data || []).filter(med => {
      if (!med.times || !Array.isArray(med.times)) return false;
      return med.times.some(t => {
        const parts = t.split(':');
        if (parts.length < 2) return false;
        const medMins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        return Math.abs(currentMins - medMins) <= 30; // within 30 minutes
      });
    });

    res.json({ dueNow });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching due now medications' });
  }
});

// POST /api/prescription/validate-scan
router.post('/validate-scan', async (req, res) => {
  const { scannedMedicine, userId } = req.body;
  if (!userId) return res.json({ valid: true });

  try {
    let data = [];
    if (supabase) {
      const { data: sbData, error } = await supabase.from('medication_schedule').select('*').eq('userId', userId);
      if (!error && sbData) data = sbData;
    } else {
      data = await MedicationSchedule.find({ userId: userId }).lean();
    }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const dueNow = (data || []).filter(med => {
      if (!med.times || !Array.isArray(med.times)) return false;
      return med.times.some(t => {
        const parts = t.split(':');
        if (parts.length < 2) return false;
        const medMins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        return Math.abs(currentMins - medMins) <= 30;
      });
    });

    const isDue = dueNow.some(med => 
      med.name.toLowerCase().includes(scannedMedicine.toLowerCase()) || 
      scannedMedicine.toLowerCase().includes(med.name.toLowerCase())
    );

    if (isDue) {
      res.json({ valid: true });
    } else {
      res.json({
        valid: false,
        message: 'WRONG MEDICATION. You are not scheduled to take this now.',
        dueMedications: dueNow
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error validating scan' });
  }
});

module.exports = router;
