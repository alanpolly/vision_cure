# VisionCure 👁️💊

**VisionCure** is an AI-powered, voice-guided healthcare companion designed to empower elderly and visually impaired users to manage their medications with clinical-grade safety and independence.

---

## 🌟 Key Features

### 🩺 Clinical Safety Engine (New!)
- **AI-Driven Interaction Check**: Uses Google Gemini 1.5 Flash to analyze your entire medication history for dangerous drug-to-drug interactions, contraindications, and dietary conflicts.
- **Severity-Coded Alerts**: Instant visual feedback with **CRITICAL (Red)**, **MODERATE (Amber)**, and **LOW (Slate)** risk cards.
- **Pulsing Danger Banner**: A high-visibility emergency banner appears at the top of the app if life-threatening combinations are detected.

### 📱 Telegram Medication Reminders (New!)
- **Smart Notifications**: Receive real-time medication alerts directly on Telegram.
- **Two-Way Adherence Tracking**: Reply **"TAKEN"** to the bot to automatically log your dose.
- **Escalation Logic**: If a dose is missed for 30 minutes, the system automatically alerts the designated caregiver.

### 🗣️ Conversational AI Voice Assistant
- **Global Medical Expert**: Powered by Groq & LLaMA 3.3, the assistant answers complex pharmaceutical questions and helps navigate the app.
- **Safety Audio Alerts**: Connected to ElevenLabs to provide automatic vocal warnings when dangerous interactions are detected.

### 🚨 Emergency SOS System
- **Nurse Hotlink**: Integrated SOS button for one-tap calling to the primary caregiver or nurse.
- **Automated Escalation**: Automatically triggers caregiver notifications if critical medications are missed.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS (Accessibility-focused UI)
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL) + MongoDB Sync Fallback
- **AI Infrastructure**:
  - **Google Gemini**: Vision processing & Clinical Analysis
  - **Groq (LLaMA 3.3)**: Lightning-fast conversational logic
  - **ElevenLabs**: High-fidelity text-to-speech
  - **Telegram Bot API**: Patient/Caregiver communication

---

## 🚀 Getting Started

### 1. Environment Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=3001
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
ELEVENLABS_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

### 2. Database Setup
Run the SQL migration found in `server/migrations/20260423_telegram_setup.sql` in your Supabase SQL editor to enable the Telegram Reminder features.

### 3. Installation
```bash
# Install and start backend
cd server
npm install
npm start

# Install and start frontend (new terminal)
cd client
npm install
npm run dev
```

---

## 🛡️ Privacy & Safety
VisionCure is built with a "Privacy First" approach. We never store raw image data after processing, and all clinical analysis is performed using encrypted API channels.

*Built by Team Midnight-Arbiters for the future of accessible healthcare.*
