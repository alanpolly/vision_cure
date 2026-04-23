# VisionCure 👁️💊

**VisionCure** is an AI-powered, voice-guided medical assistant designed to help elderly and visually impaired users manage their daily medications safely and independently. 

Built to demonstrate accessible, next-generation healthcare technology.

## 🌟 Key Features

- **🗣️ Conversational AI Voice Assistant:** A vocal medical assistant (powered by Groq & LLaMA 3.3) that answers questions about medication schedules, side effects, and app navigation through natural speech.
- **📸 Smart Medicine Scanner:** Uses device cameras and AI Vision (Google Gemini) to instantly identify prescription bottles and determine if they are safe to take based on the user's real-time schedule.
- **⚠️ Safety Checks & Contraindications:** Cross-references detected medications to prevent dangerous drug interactions (e.g., warning users about dietary conflicts when taking specific blood thinners).
- **📅 Dynamic Timeline:** Offers a real-time, easy-to-read daily medication timeline indicating what to take now (Green), what is pending, and what has already been taken.
- **🚨 Emergency SOS:** One-tap or voice-activated immediate calling to a designated caregiver or nurse

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS (for large-text & accessible contrast)
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL)
- **AI Integrations:** 
  - [Groq API](https://groq.com/) (using `llama-3.3-70b-versatile`) for lightning-fast voice instruction processing.
  - [Google Gemini API](https://aistudio.google.com/) for multi-modal image processing and text extraction.

## 🚀 Running the Project Locally

### 1. Prerequisites
- Node.js (v18+)
- Git

### 2. Environment Setup
To keep API keys secure, this project uses `.env` files. You must create a `.env` file in the `server/` directory before running the app. 

Copy the provided `.env.example` file and fill in your keys:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
```

### 3. Start the Backend Server
```bash
cd server
npm install
npm start
```
*The server will run on http://localhost:3001*

### 4. Start the Frontend Application
Open a new terminal window:
```bash
cd client
npm install
npm run dev -- --host
```
*The app will be accessible via your Localhost and your Network IP (e.g., `https://192.168.1.X:5173`).*

> **Note on Browser Security:** The frontend uses a self-signed SSL plugin (`@vitejs/plugin-basic-ssl`). This is strictly required to enable microphone and camera access on mobile devices during local testing. You may need to click "Advanced -> Proceed" to bypass the browser's temporary security warning when opening the app.

---
*Built by Team Midnight-Arbiters.*
