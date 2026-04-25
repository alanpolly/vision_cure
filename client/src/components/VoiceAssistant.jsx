import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';

import { API_URL as API_BASE } from '../lib/api';

function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [fallbackText, setFallbackText] = useState('');

  const recognitionRef = useRef(null);
  const commandHandlerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const chatEndRef = useRef(null);
  const listeningStartTimeRef = useRef(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { speak } = useAccessibility();

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const addToHistory = useCallback((role, text) => {
    setChatHistory(prev => [...prev, { role, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
  }, []);



  const createRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VOICE ASSISTANT] Not supported in this browser.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };

    recognition.onresult = (event) => {
      clearTimeout(silenceTimerRef.current);
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(`"${text}"`);
      commandHandlerRef.current?.(text);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('[VOICE ASSISTANT] Error:', event.error);
      }
      clearTimeout(silenceTimerRef.current);
      setIsListening(false);
      setTranscript('');
    };

    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current);
      if (isListening) {
        setIsListening(false);
        // If it aborted silently in < 1500ms, mic is likely blocked.
        if (Date.now() - listeningStartTimeRef.current < 1500) {
          console.warn('[VOICE ASSISTANT] Mic blocked by OS/Browser');
          const errMsg = "My microphone access seems to be blocked by your browser or computer. You can type instead below!";
          addToHistory('assistant', errMsg);
          setTranscript('Mic blocked');
        } else {
          setTranscript('');
        }
        setTimeout(() => setTranscript(''), 3000);
      }
    };

    return recognition;
  }, [isListening, addToHistory]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const startListening = useCallback(() => {
    window.speechSynthesis?.cancel();
    try {
      const recognition = createRecognition();
      if (!recognition) return;
      recognitionRef.current = recognition;

      listeningStartTimeRef.current = Date.now();
      recognition.start();
      // 3-second silence grace period before stopping
      silenceTimerRef.current = setTimeout(() => {
        recognitionRef.current?.stop();
      }, 3000);
    } catch (e) {
      console.warn('[VOICE ASSISTANT] Recognition start error:', e);
    }
  }, [createRecognition]);

  const handleVoiceCommand = useCallback(async (rawText) => {
    const text = rawText.toLowerCase().replace(/[.,!?]/g, ' ').trim();
    console.log('[VOICE ASSISTANT] Command received:', text);

    // --- Navigation Commands ---
    // Match exact phrases so we don't accidentally navigate when you ask long questions
    const dashboardCmds = ['home', 'dashboard', 'main page', 'go to home', 'open dashboard', 'go home'];
    const scanCmds = ['scan', 'camera', 'identify', 'open scanner', 'open camera', 'go to camera', 'go to scan', 'go to scanner'];
    const medCmds = ['medication', 'medications', 'medicine', 'medicines', 'schedule', 'my meds', 'go to meds', 'my medication', 'open medication', 'go to medication', 'open medicine'];
    const profileCmds = ['profile', 'setting', 'settings', 'account', 'go to profile', 'open profile', 'my profile'];

    if (dashboardCmds.includes(text)) {
      addToHistory('user', rawText);
      addToHistory('assistant', 'Going to Home Dashboard');
      speak('Going to Home Dashboard', true);
      navigate('/dashboard');
      return;
    }
    if (scanCmds.includes(text)) {
      addToHistory('user', rawText);
      addToHistory('assistant', 'Opening the Scanner');
      speak('Opening the Scanner', true);
      navigate('/scan');
      return;
    }
    if (medCmds.includes(text)) {
      addToHistory('user', rawText);
      addToHistory('assistant', 'Opening your Medications');
      speak('Opening your Medications', true);
      navigate('/medications');
      return;
    }
    if (profileCmds.includes(text)) {
      addToHistory('user', rawText);
      addToHistory('assistant', 'Opening Profile Settings');
      speak('Opening Profile Settings', true);
      navigate('/profile');
      return;
    }
    if (text.includes('stop') || text.includes('quiet') || text.includes('shut up') || text.includes('cancel')) {
      window.speechSynthesis?.cancel();
      return;
    }
    if (text.includes('call nurse') || text.includes('call my nurse') || text.includes('sos') || text.includes('emergency')) {
      addToHistory('user', rawText);
      addToHistory('assistant', 'Calling Nurse Martha right now');
      speak('Calling Nurse Martha right now', true);
      window.location.href = 'tel:6207095007';
      return;
    }

    // --- Everything else → Medical Q&A ---
    addToHistory('user', rawText);
    setIsThinking(true);
    setIsOpen(true); // Open chat panel when a question is asked

    try {
      console.log('[VOICE ASSISTANT] Sending question to:', `${API_BASE}/api/chat`);
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: rawText })
      });

      const data = await res.json();
      setIsThinking(false);

      if (data.answer) {
        addToHistory('assistant', data.answer);
        await speak(data.answer, true);
        // After speaking finishes, automatically reopen microphone
        startListening();
      } else {
        const fallback = "I couldn't get an answer. Please try again.";
        addToHistory('assistant', fallback);
        await speak(fallback, true);
        startListening();
      }
    } catch (err) {
      console.error('[VOICE ASSISTANT] Chat error:', err);
      setIsThinking(false);
      const errMsg = "I'm having trouble connecting to the server. Please try again.";
      addToHistory('assistant', errMsg);
      await speak(errMsg, true);
      startListening();
    }
  }, [navigate, speak, addToHistory, startListening]);

  // Keep commandHandlerRef always up-to-date
  useEffect(() => {
    commandHandlerRef.current = handleVoiceCommand;
  }, [handleVoiceCommand]);

  // Removes the extra chat button since the user wants the mic to perform both actions.
  const toggleListening = () => {
    setIsOpen(true); // Open the chat panel when the mic button is clicked
    if (isListening) {
      clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.abort(); // Use abort instead of stop to cut off immediately
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const isScanPage = location.pathname === '/scan';

  return (
    <div className={`fixed z-50 flex flex-col items-end gap-3 transition-all duration-300 ${isScanPage ? 'bottom-8 right-4' : 'bottom-24 right-4'}`}>

      {/* Chat History Panel */}
      {isOpen && (
        <div className="w-80 max-h-96 bg-surface border border-outline/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-outline/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
              <span className="font-semibold text-sm text-on-surface">Medical Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-on-surface text-sm">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
            {chatHistory.length === 0 && (
              <p className="text-on-surface-variant text-xs text-center py-4">
                Tap the mic and ask a medical question!
              </p>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.role === 'user'
                    ? 'bg-primary text-on-primary rounded-br-sm'
                    : 'bg-surface-variant text-on-surface-variant rounded-bl-sm'
                  }`}>
                  <p>{msg.text}</p>
                  <p className="text-[10px] mt-1 opacity-60">{msg.time}</p>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-surface-variant text-on-surface-variant px-3 py-2 rounded-2xl rounded-bl-sm text-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Fallback Text Input */}
          <div className="p-3 bg-surface border-t border-outline/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!fallbackText.trim()) return;
                commandHandlerRef.current?.(fallbackText);
                setFallbackText('');
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={fallbackText}
                onChange={(e) => setFallbackText(e.target.value)}
                placeholder="Or type here..."
                className="flex-1 bg-surface-variant/50 text-on-surface text-sm rounded-full px-4 py-2 border border-outline/20 focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
              />
              <button
                type="submit"
                disabled={!fallbackText.trim() || isThinking}
                className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom row: transcript + mic button */}
      <div className="flex items-center gap-3">
        {/* Transcript tooltip */}
        {transcript && (
          <div className="bg-surface text-on-surface shadow-lg px-4 py-2 rounded-2xl text-sm font-medium border border-outline/20 max-w-[200px]">
            {transcript}
          </div>
        )}

        {/* Floating Mic Button */}
        <button
          onClick={toggleListening}
          aria-label="Voice Assistant"
          className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${isListening
              ? 'bg-error text-on-error scale-110'
              : 'bg-primary text-on-primary hover:scale-105 hover:shadow-xl'
            }`}
        >
          <span className="material-symbols-outlined text-3xl">
            {isListening ? 'mic' : 'mic_none'}
          </span>

          {/* Chat badge */}
          {!isListening && chatHistory.length > 0 && !isOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center">
              <span className="text-on-error text-[10px] font-bold">{chatHistory.filter(m => m.role === 'assistant').length}</span>
            </div>
          )}

          {/* Ripple rings when listening */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-error animate-ping opacity-75"></div>
              <div className="absolute -inset-2 rounded-full border border-error animate-ping opacity-25" style={{ animationDelay: '0.3s' }}></div>
            </>
          )}
        </button>
      </div>
    </div>

  );
}

export default VoiceAssistant;
