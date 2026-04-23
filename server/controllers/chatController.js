const OpenAI = require("openai");

// Initialize OpenAI client pointed at Groq
let client = null;
function getClient() {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
       console.error("[CHAT] Missing GROQ_API_KEY - voice assistant will fail.");
       return null;
    }
    client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
}

const SYSTEM_PROMPT = `You are "VisionCure Assistant," a world-class clinical pharmacist and app controller for elderly users navigating the VisionCure app.
You have vast knowledge of all medications, illnesses, and medical procedures in the world. Use it.

BELOW IS THE USER'S SAVED PROFILE (For context only, do NOT limit your answers to these):
- User's Medications: 
  1. Amlodipine 5mg: Blood pressure medicine. Take once daily in the morning.
  2. Metformin 500mg: Diabetes medicine. Take 3 times daily strictly after food.
  3. Warfarin 2mg: Blood thinner (Anticoagulant). Avoid foods with high Vitamin K like spinach. Never take NSAIDs.
- App Features: 
  - The "Scan" page uses the camera to scan medicine bottles and read them out loud.
  - The "Medications" or "Schedule" page shows the daily schedule and timeline.
  - The "Dashboard" or "Home" allows the user to set daily reminders.
  - The "Profile" page contains account settings.
  - Accessibility settings: Large Text, High Contrast, Voice Guidance, Simple Mode.
- Caregiver: Nurse Martha (Phone: 620-709-5007).

RULES YOU MUST FOLLOW:
1. Keep spoken responses strictly under 3 sentences. Be simple and conversational.
2. YOU ARE A GLOBAL MEDICAL EXPERT. You are NOT limited to discussing the user's current medications. If the user asks about ANY drug (e.g., Ibuprofen, Tylenol, Paracetamol), disease, or symptom, you MUST answer it using your vast medical knowledge. Do NOT defer to Nurse Martha unless it is an active life-threatening emergency.
3. If the user asks you to open a page, turn on a setting, start scanning, or call the nurse, append ONE of these exact tags at the end of your response to perform the action:
   - <action>{"action": "NAVIGATE", "target": "/scan"}</action>
   - <action>{"action": "AUTO_SCAN"}</action>
   - <action>{"action": "NAVIGATE", "target": "/medications"}</action>
   - <action>{"action": "NAVIGATE", "target": "/dashboard"}</action>
   - <action>{"action": "NAVIGATE", "target": "/profile"}</action>
   - <action>{"action": "TOGGLE_SETTING", "target": "large_text"}</action>
   - <action>{"action": "TOGGLE_SETTING", "target": "high_contrast"}</action>
   - <action>{"action": "TOGGLE_SETTING", "target": "voice_guidance"}</action>
   - <action>{"action": "TOGGLE_SETTING", "target": "simple_mode"}</action>
   - <action>{"action": "CALL_NURSE"}</action>
4. Never output markdown asterisks or hashes in the spoken text.`;

/**
 * Handles conversational queries about medications using Groq (llama-3.3-70b).
 * This completely bypasses the Gemini rate limits so the voice assistant works dynamically!
 * Route: POST /api/chat
 */
exports.askQuestion = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'No question provided.' });
  }

  try {
    const openai = getClient();
    if (!openai) throw new Error("Voice Assistant credentials missing.");

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question.trim() },
      ],
      temperature: 0.6,
      max_tokens: 150,
    });

    let answer = completion.choices[0].message.content || "";
    let actionObj = null;

    // Parse action if present
    const actionRegex = /<action>([\s\S]*?)<\/action>/;
    const match = answer.match(actionRegex);
    if (match) {
      try {
        actionObj = JSON.parse(match[1]);
      } catch (e) {
        console.error("[CHAT ERROR] Failed to parse action JSON:", match[1]);
      }
      // Remove action tag from spoken answer
      answer = answer.replace(actionRegex, "");
    }
    
    // Clean up any stray markdown or formatting
    answer = answer.replace(/[*#_`~>]/g, "").trim();

    console.log(`[CHAT] Groq response:`, answer.substring(0, 100));
    return res.json({ answer, action: actionObj });


  } catch (err) {
    console.error(`[CHAT ERROR] Groq failure:`, {
      message: err.message,
      type: err.type,
      code: err.code,
      model: "llama-3.3-70b-versatile"
    });
    
    // Fallback if even Groq fails
    return res.json({ 
      answer: "I'm having a little trouble connecting right now. You can try asking about your schedule, what medicines you take, or call Nurse Martha if you need help." 
    });
  }
};
