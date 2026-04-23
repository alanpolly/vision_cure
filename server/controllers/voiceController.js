const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

// Initialize OpenAI client pointed at Groq for Whisper
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/**
 * Transcribe audio using Groq Whisper (whisper-large-v3-turbo)
 * Route: POST /api/voice/transcribe
 */
exports.transcribe = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No audio file provided.' });
    }

    console.log(`[VOICE] Transcribing in-memory: ${req.file.originalname} (${req.file.size} bytes)`);

    // Use OpenAI.toFile to create a virtual file from the buffer
    // This avoids writing to disk (ENOSPC fix)
    const file = await OpenAI.toFile(req.file.buffer, 'recording.webm');

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "en",
    });

    console.log(`[VOICE] Transcription results: "${transcription.text}"`);
    res.json({ text: transcription.text });

  } catch (err) {
    console.error('[VOICE ERROR] Transcription failed:', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to transcribe audio.' });
  }
};

/**
 * Convert text to speech using ElevenLabs API
 * Route: POST /api/voice/speak
 */
exports.speak = async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!text) {
    return res.status(400).json({ status: 'error', message: 'No text provided.' });
  }

  if (!apiKey || apiKey === 'dummy') {
    console.warn('[VOICE] ElevenLabs API key is missing or dummy. Voice output will be disabled.');
    return res.status(503).json({ status: 'error', message: 'TTS service not configured.' });
  }

  try {
    // Standard premade "Rachel" ID: 21m00Tcm4TlvDq8ikWAM
    // This is more likely to exist on across accounts than others.
    let voiceId = "21m00Tcm4TlvDq8ikWAM"; 
    
    // Check if the voice exists, or fallback to the first available if not
    // We could fetch /v1/voices here, but for now we'll just try the standard ID.
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        }
      }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`ElevenLabs API error: ${errorMsg}`);
    }

    // Set appropriate headers for audio streaming
    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
    });

    // Pipe the response body stream directly to the express response
    const reader = response.body.getReader();
    
    // Helper to stream from reader to res
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
          controller.enqueue(value);
        }
        res.end();
        controller.close();
      }
    });

  } catch (err) {
    console.error('[VOICE ERROR] TTS failed:', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to generate speech.' });
  }
};
