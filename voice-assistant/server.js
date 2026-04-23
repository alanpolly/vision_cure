// ============================================
// VisionCure — Voice Assistant Server
// Uses Google Gemini 2.0 Flash
// ============================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.VOICE_PORT || 3000;

// ---- Gemini client ----
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const SYSTEM_PROMPT = `You are "VisionCure Assistant," a gentle, patient, and concise voice-based medical guide for elderly users navigating the VisionCure website.

Rules you MUST follow:
1. Keep every response strictly under 2 sentences.
2. Use simple, warm, conversational language — no jargon.
3. Never output markdown, bullet points, numbered lists, asterisks, or hashtags.
4. If you don't know something, say so honestly and suggest the user ask their doctor.
5. Guide the user step-by-step through the website when asked (e.g., "Click the big green Scan button at the center of your screen").
6. Always prioritize patient safety — never diagnose or prescribe.`;

// ---- Hardcoded fallback Q&A ----
const FALLBACK_QA = {
  'hello': 'Hello! I am your VisionCure assistant. How can I help you today?',
  'hi': 'Hi there! How can I assist you today?',
  'help': 'I can help you navigate the VisionCure app, answer questions about your medicines, or guide you through scanning a bottle.',
  'scan': 'To scan a medicine, tap the Scan button at the bottom of your screen, then point your camera at the medicine label.',
  'medication': 'You can view your medication schedule by tapping the Medications tab at the bottom of your screen.',
  'how are you': 'I am doing well, thank you! How can I help you with your medicines today?',
};

function getFallbackReply(message) {
  const msg = message.toLowerCase().trim();
  for (const [key, reply] of Object.entries(FALLBACK_QA)) {
    if (msg.includes(key)) return reply;
  }
  return "I'm sorry, I couldn't process that right now. Please try again in a moment, or ask me about your medicines or how to use the app.";
}

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, "public")));

// ---- Chat endpoint ----
app.post("/api/chat", async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
    return res.status(400).json({ error: "userMessage is required." });
  }

  try {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "System instruction: " + SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will follow all the rules. I'm ready to help." }],
        },
      ],
    });

    const result = await chat.sendMessage(userMessage.trim());
    let reply = result.response.text() || "";
    // Strip any accidental markdown
    reply = reply.replace(/[*#_`~>]/g, "").trim();

    res.json({ reply });
  } catch (err) {
    console.error("[GEMINI ERROR]", err.message || err);

    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      // Use fallback instead of returning error
      const fallback = getFallbackReply(userMessage);
      return res.json({ reply: fallback });
    }

    // For any other error, also try fallback
    const fallback = getFallbackReply(userMessage);
    res.json({ reply: fallback });
  }
});

// Fallback: serve index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`\n🎙️  VisionCure Voice Assistant running → http://localhost:${PORT}\n`);
});
