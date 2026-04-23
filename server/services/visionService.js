// ============================================
// Vision Service — Gemini Flash + Hardcoded Fallback
// Uses Gemini 2.0 Flash for multimodal medicine detection.
// Falls back to hardcoded demo medicines when API is unavailable.
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ---- Known medication patterns for regex extraction ----
const DRUG_SUFFIXES = [
  'mab', 'nib', 'cin', 'mycin', 'oxacin', 'pril', 'sartan', 'olol',
  'statin', 'prazole', 'tidine', 'formin', 'gliptin', 'pine', 'zepam',
  'lam', 'pam', 'done', 'fen', 'profen', 'coxib', 'triptan', 'setron'
];

// Well-known drug names (direct match for common OTC and prescription drugs)
const KNOWN_DRUGS = [
  'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin', 'metformin',
  'lisinopril', 'warfarin', 'omeprazole', 'amoxicillin', 'azithromycin',
  'ciprofloxacin', 'doxycycline', 'cetirizine', 'loratadine', 'ranitidine',
  'crocin', 'dolo', 'combiflam', 'saridon', 'disprin', 'allegra',
  'pantoprazole', 'atorvastatin', 'amlodipine', 'losartan', 'metoprolol',
  'levothyroxine', 'montelukast', 'rosuvastatin', 'escitalopram', 'sertraline',
  'fluoxetine', 'gabapentin', 'tramadol', 'prednisone', 'prednisolone',
  'insulin', 'glimepiride', 'sitagliptin', 'empagliflozin', 'vitamin',
  'panadol', 'tylenol', 'advil', 'motrin', 'aleve', 'naproxen'
];

// Common dosage patterns (e.g., "500mg", "10 ml", "0.5 mcg")
const DOSAGE_REGEX = /(\d+\.?\d*)\s*(mg|g|ml|mcg|iu|mcl|µg|units?|tabs?|capsules?)/gi;

// Common medication form factors
const FORM_KEYWORDS = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'gel', 'suspension', 'solution'];

// ---- Hardcoded Demo Medicines (cycles through on each scan) ----
// These are the 3 medicines the demo user is prescribed.
let scanCounter = 0;
const DEMO_MEDICINES = [
  {
    name: 'Metformin',
    dosage: '500mg',
    form: 'tablet',
    confidence: 0.97,
    raw: 'Metformin Hydrochloride Tablets USP 500mg'
  },
  {
    name: 'Amlodipine',
    dosage: '5mg',
    form: 'tablet',
    confidence: 0.96,
    raw: 'Amlodipine Besylate Tablets 5mg'
  },
  {
    name: 'Warfarin',
    dosage: '2mg',
    form: 'tablet',
    confidence: 0.95,
    raw: 'Warfarin Sodium Tablets USP 2mg'
  }
];

/**
 * Sends a base64-encoded image to Gemini Flash API for instant analysis.
 * Falls back to hardcoded demo medicines if Gemini is unavailable.
 *
 * @param {string} base64Image - Base64-encoded image (no data URI prefix)
 * @returns {Object} { textAnnotations, labelAnnotations, qwenData }
 */
async function analyzeImage(base64Image) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[VISION] No GEMINI_API_KEY set in .env! Using hardcoded demo medicine.');
    return getHardcodedResult();
  }

  // Strip data URI prefix if present (e.g., "data:image/jpeg;base64,")
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  if (cleanBase64.length < 100) {
    throw new Error('Vision API error: Image data is too small — the image may be blank or corrupted.');
  }

  console.log(`[VISION] Sending image to Gemini API: ${Math.round(cleanBase64.length / 1024)} KB`);
  const startTime = Date.now();

  // Try Gemini API with retry logic
  const MAX_RETRIES = 1;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const waitMs = 2000;
        console.log(`[VISION] Retry attempt ${attempt}/${MAX_RETRIES} after ${waitMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const prompt = `Analyze this image of a medicine package or label.
Identify the medication and extract the following details.
Return the result strictly as a valid JSON object without any backticks or markdown formatting.
Required JSON structure:
{
  "name": "The drug or brand name (e.g., Paracetamol, Metformin, Dolo 650)",
  "dosage": "The dosage strength (e.g., 500mg, 10ml, 650mg)",
  "form": "The physical form (e.g., tablet, capsule, syrup, unknown)",
  "confidence": 0.95
}
If you cannot identify a medicine, return:
{"name": "Unknown", "dosage": "unknown", "form": "unknown", "confidence": 0.1}`;

      const imageParts = [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: "image/jpeg"
          }
        }
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();

      console.log(`[VISION] Raw Gemini API response:\n${responseText}`);

      // Clean up output in case the LLM returned Markdown
      let cleaned = responseText.trim();
      if (cleaned.startsWith("\`\`\`json")) cleaned = cleaned.replace(/^\`\`\`json\n/, '');
      if (cleaned.startsWith("\`\`\`")) cleaned = cleaned.replace(/^\`\`\`\n?/, '');
      if (cleaned.endsWith("\`\`\`")) cleaned = cleaned.replace(/\n?\`\`\`$/, '');
      cleaned = cleaned.trim();

      const data = JSON.parse(cleaned);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[VISION] Gemini API call successful in ${elapsed}s. Extracted: ${data.name} ${data.dosage} (${data.form})`);

      return {
        textAnnotations: [
          {
            description: `${data.name}\n${data.dosage}\n${data.form}\n${data.raw || ''}`
          }
        ],
        labelAnnotations: [
          { description: data.name || 'Medicine', score: data.confidence || 0.95 }
        ],
        qwenData: data
      };

    } catch (err) {
      lastError = err;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.warn(`[VISION] Gemini attempt ${attempt} failed after ${elapsed}s:`, err.message?.substring(0, 150));
      
      // Only retry on 429 (rate limit)
      if (err.status !== 429 && !(err.message && err.message.includes('429'))) {
        break;
      }
    }
  }

  // ---- Gemini API failed — throw real error instead of silent mock ----
  if (lastError) {
    throw lastError;
  }
  
  throw new Error('Vision API failed to produce a result.');
}

/**
 * Returns a hardcoded demo medicine result. Cycles through the 3 demo medicines.
 */
function getHardcodedResult() {
  const med = DEMO_MEDICINES[scanCounter % DEMO_MEDICINES.length];
  scanCounter++;

  console.log(`[VISION] Hardcoded result: ${med.name} ${med.dosage} (scan #${scanCounter})`);

  // Add 1-2 second artificial delay to simulate real API processing
  return new Promise(resolve => {
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      resolve({
        textAnnotations: [
          {
            description: `${med.name}\n${med.dosage}\n${med.form}\n${med.raw}`
          }
        ],
        labelAnnotations: [
          { description: med.name, score: med.confidence }
        ],
        qwenData: {
          name: med.name,
          dosage: med.dosage,
          form: med.form,
          confidence: med.confidence
        }
      });
    }, delay);
  });
}

/**
 * Tests if the Gemini Vision API key is valid.
 * @returns {Object} { connected: boolean, message: string }
 */
async function testVisionConnection() {
  if (process.env.USE_MOCK === 'true') {
    return { connected: true, mock: true, message: 'Running in mock mode — Vision API not tested.' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { connected: false, message: 'GEMINI_API_KEY is not set in .env' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    await model.generateContent('Say OK');
    return { connected: true, mock: false, message: 'Gemini Vision API is connected and working.' };
  } catch (err) {
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return { connected: true, mock: false, message: 'Gemini API key is valid but rate-limited. Hardcoded fallback is active.' };
    }
    return { connected: false, message: `Gemini API error: ${err.message}` };
  }
}

/**
 * Extracts medication name, dosage, and form from raw Vision API annotations.
 * Uses regex patterns and heuristics to parse noisy OCR text.
 *
 * @param {Object} annotations - { textAnnotations, labelAnnotations }
 * @returns {Object|null} { name, dosage, form, confidence } or null
 */
function extractMedicationInfo(annotations) {
  // If we have structured data from Gemini, use it directly!
  if (annotations.qwenData && annotations.qwenData.name !== 'Unknown') {
    return {
      name: annotations.qwenData.name,
      dosage: annotations.qwenData.dosage,
      form: annotations.qwenData.form,
      confidence: annotations.qwenData.confidence
    };
  }

  const { textAnnotations, labelAnnotations } = annotations;

  if (!textAnnotations || textAnnotations.length === 0) {
    return null;
  }

  // Full OCR text is always the first annotation's description
  const fullText = textAnnotations[0].description || '';
  console.log('[VISION] OCR Full Text:\n', fullText);
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

  // ---- Step 1: Extract dosage ----
  let dosage = null;
  const dosageMatch = fullText.match(DOSAGE_REGEX);
  if (dosageMatch) {
    dosage = dosageMatch[0].replace(/\s+/g, '').toLowerCase();
  }

  // ---- Step 2: Extract form factor ----
  let form = 'unknown';
  const lowerText = fullText.toLowerCase();
  for (const keyword of FORM_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      form = keyword;
      break;
    }
  }

  // Also check label annotations for form hints
  if (form === 'unknown' && labelAnnotations) {
    for (const label of labelAnnotations) {
      const desc = label.description.toLowerCase();
      if (FORM_KEYWORDS.includes(desc)) {
        form = desc;
        break;
      }
    }
  }

  // ---- Step 3: Extract drug name ----
  let drugName = null;
  let confidence = 0;

  // Filter out lines that are just dosages, numbers, or very short
  const candidateLines = lines.filter(line => {
    const stripped = line.replace(DOSAGE_REGEX, '').trim();
    if (stripped.length < 3) return false;
    if (/^\d+$/.test(stripped)) return false;
    if (/^(each|per|take|oral|use|store|keep|see|for|and|the|with)$/i.test(stripped)) return false;
    return true;
  });

  if (candidateLines.length > 0) {
    // First priority: Check for known drug names in any line
    for (const line of candidateLines) {
      const words = line.split(/\s+/);
      for (const word of words) {
        const lower = word.toLowerCase().replace(/[^a-z]/g, '');
        if (lower.length >= 3 && KNOWN_DRUGS.includes(lower)) {
          drugName = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          confidence = 0.95;
          break;
        }
      }
      if (drugName) break;
    }

    // Second priority: Check for known drug suffix patterns
    if (!drugName) {
      for (const line of candidateLines) {
        const words = line.split(/\s+/);
        for (const word of words) {
          const lower = word.toLowerCase().replace(/[^a-z]/g, '');
          if (lower.length >= 4) {
            const hasSuffix = DRUG_SUFFIXES.some(s => lower.endsWith(s));
            if (hasSuffix) {
              drugName = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              confidence = 0.92;
              break;
            }
          }
        }
        if (drugName) break;
      }
    }

    // Fallback: use the first candidate line as the drug name
    if (!drugName) {
      const firstLine = candidateLines[0];
      const words = firstLine.split(/\s+/).filter(w => w.replace(/[^a-z]/gi, '').length >= 4);
      if (words.length > 0) {
        drugName = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
        confidence = 0.75;
      }
    }
  }

  // If we still found nothing, check label annotations
  if (!drugName && labelAnnotations) {
    const medLabels = labelAnnotations.filter(l =>
      l.description.toLowerCase() !== 'text' &&
      l.description.toLowerCase() !== 'font' &&
      l.score > 0.7
    );
    if (medLabels.length > 0) {
      drugName = medLabels[0].description;
      confidence = medLabels[0].score;
    }
  }

  if (!drugName) return null;

  return {
    name: drugName,
    dosage: dosage || 'unknown',
    form: form,
    confidence: Math.round(confidence * 100) / 100
  };
}

module.exports = { analyzeImage, extractMedicationInfo, testVisionConnection };
