import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../lib/api';
import Icon from './Icon';
import { useAuth } from '../../context/AuthContext';

export default function DashVoiceMic() {
  const { user } = useAuth();
  const [listening, setListening] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am your AI Medical Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const handleSendRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatOpen, isThinking]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const speak = (text) => {
    window.speechSynthesis?.cancel();
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.volume = 1;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceCommand = useCallback((text) => {
    const lower = text.toLowerCase().replace(/[.,!?]/g, ' ').trim();
    const dashboardCmds = ['home', 'dashboard', 'main page', 'go to home'];
    const scanCmds = ['scan', 'camera', 'identify', 'open scanner'];
    const medCmds = ['medication', 'medications', 'medicine', 'medicines', 'schedule'];
    const profileCmds = ['profile', 'settings', 'account', 'go to profile'];

    if (dashboardCmds.some(cmd => lower.includes(cmd))) {
      navigate('/dashboard');
      return "Going to Home Dashboard";
    }
    if (scanCmds.some(cmd => lower.includes(cmd))) {
      navigate('/scan');
      return "Opening the Scanner";
    }
    if (medCmds.some(cmd => lower.includes(cmd))) {
      navigate('/medications');
      return "Opening your Medications";
    }
    if (profileCmds.some(cmd => lower.includes(cmd))) {
      navigate('/profile');
      return "Opening Profile Settings";
    }
    if (lower.includes('stop') || lower.includes('quiet') || lower.includes('shut up')) {
      window.speechSynthesis?.cancel();
      return "Okay, I'll be quiet.";
    }
    if (lower.includes('call nurse') || lower.includes('sos') || lower.includes('emergency')) {
      window.location.href = 'tel:6207095007';
      return "Calling your nurse right now.";
    }
    return null; 
  }, [navigate]);

  const handleSend = useCallback(async (e, voiceOveride = null) => {
    e?.preventDefault();
    const text = (voiceOveride || input).trim();
    if (!text) return;

    if (text === 'Microphone blocked by browser.') {
        setMessages(prev => [...prev, { role: 'assistant', text: "It seems your microphone access is blocked. Please allow mic access or type your question!" }]);
        speak("It seems your microphone access is blocked.");
        return;
    }
    
    if (text === 'Microphone hardware issue.') {
        setMessages(prev => [...prev, { role: 'assistant', text: "Your microphone hardware isn't responding ('audio-capture' error). Please check your Windows Privacy settings, or your physical mute switch, and ensure no other app is using your mic." }]);
        speak("Your microphone hardware isn't responding. Please type your question.");
        return;
    }

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsThinking(true);
    setChatOpen(true);

    const navResponse = handleVoiceCommand(text);
    if (navResponse) {
      setIsThinking(false);
      setMessages(prev => [...prev, { role: 'assistant', text: navResponse }]);
      speak(navResponse);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, userId: user?.id || 'demo-user' })
      });
      const data = await res.json();
      
      const answer = data.answer || "I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
      speak(answer);
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = "I'm having trouble connecting to the server. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', text: errMsg }]);
      speak(errMsg);
    } finally {
      setIsThinking(false);
    }
  }, [input, handleVoiceCommand]);

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const toggleMic = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    setChatOpen(true);

    if (listening && recognitionRef.current) {
      console.log('Stopping active mic');
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    console.log('Starting new mic instance');
    window.speechSynthesis?.cancel();

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Voice recognition is not supported in this browser. You can type your request.' }]);
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        console.log('Mic properly started listening on browser API');
        setListening(true);
      };

      rec.onresult = (event) => {
        const current = event.resultIndex;
        const resultText = event.results[current][0].transcript;
        console.log('Heard this:', resultText);
        if (handleSendRef.current) {
          handleSendRef.current(null, resultText);
        }
      };

      rec.onerror = (event) => {
        console.error('Mic Error Caught:', event.error);
        if (event.error === 'not-allowed') {
          if (handleSendRef.current) {
            handleSendRef.current(null, 'Microphone blocked by browser.');
          }
        } else if (event.error === 'audio-capture') {
          if (handleSendRef.current) {
            handleSendRef.current(null, 'Microphone hardware issue.');
          }
        } else if (event.error === 'no-speech') {
            console.log("No speech detected by browser");
        }
        setListening(false);
      };

      rec.onend = () => {
        console.log('Mic ended sequence');
        setListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition totally", err);
      setListening(false);
    }
  };

  const toggleChat = () => {
    setChatOpen(c => !c);
  };

  return (
    <>
      <div 
        className="glass-strong"
        style={{
          position: 'fixed',
          right: 28,
          bottom: 220,
          width: 'calc(100vw - 56px)',
          maxWidth: 380,
          height: 480,
          maxHeight: '60vh',
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          opacity: chatOpen ? 1 : 0,
          transform: chatOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          pointerEvents: chatOpen ? 'auto' : 'none',
          transition: 'all 300ms cubic-bezier(.34,1.56,.64,1)',
          overflow: 'hidden'
        }}
      >
        <div className="row between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center' }}>
              <Icon name="sparkles" size={14} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Medical Assistant</div>
          </div>
          <button className="btn-icon" onClick={() => setChatOpen(false)} style={{ width: 28, height: 28 }}>
            <Icon name="close" size={14} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-sunken)',
              color: m.role === 'user' ? 'white' : 'var(--text)',
              padding: '12px 16px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              maxWidth: '85%',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              fontSize: 14,
              lineHeight: 1.5,
              wordWrap: 'break-word',
            }}>
              {m.text}
            </div>
          ))}
          {isThinking && (
            <div style={{
              alignSelf: 'flex-start',
              background: 'var(--surface-sunken)',
              color: 'var(--text)',
              padding: '14px 16px',
              borderRadius: '18px 18px 18px 4px',
              border: '1px solid var(--border)',
              display: 'flex', gap: 4
            }}>
              <span style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%', animation: 'bounce 1s infinite' }}/>
              <span style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%', animation: 'bounce 1s infinite .2s' }}/>
              <span style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%', animation: 'bounce 1s infinite .4s' }}/>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="row gap-2" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <input 
            type="text" 
            placeholder={listening ? "Listening to your voice..." : "Ask something..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={listening}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 999,
              border: '1px solid var(--border-strong)',
              background: 'var(--surface-sunken)',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'all 200ms',
            }}
          />
          <button 
            type="submit"
            disabled={listening || isThinking || !input.trim()}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: (input.trim() && !listening && !isThinking) ? 'var(--accent)' : 'var(--surface-sunken)',
              color: (input.trim() && !listening && !isThinking) ? 'white' : 'var(--text-3)',
              display: 'grid', placeItems: 'center',
              border: 'none', cursor: 'pointer', transition: 'all 200ms'
            }}
          >
            <Icon name="send" size={16} />
          </button>
        </form>
      </div>

      <div style={{ position: 'fixed', right: 28, bottom: 96, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 90 }}>
        <button
          onClick={toggleChat}
          aria-label="Open Chat"
          style={{
            width: 52, height: 52, borderRadius: 999,
            background: chatOpen ? 'var(--text)' : 'var(--surface-strong)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            color: chatOpen ? 'var(--bg)' : 'var(--text)',
            display: 'grid', placeItems: 'center',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 300ms cubic-bezier(.4,0,.2,1)',
          }}
        >
          <Icon name="chat" size={20}/>
        </button>

        <button
          onClick={toggleMic}
          aria-label="Voice assist"
          style={{
            position: 'relative',
            width: 52, height: 52, borderRadius: 999,
            background: listening ? 'var(--accent)' : 'var(--surface-strong)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            color: listening ? 'white' : 'var(--text)',
            display: 'grid', placeItems: 'center',
            boxShadow: listening
              ? '0 0 0 8px var(--accent-soft), var(--shadow-lg)'
              : 'var(--shadow-md)',
            transition: 'all 300ms cubic-bezier(.4,0,.2,1)',
          }}
        >
          <Icon name="mic" size={20}/>
          {listening && (
            <span style={{
              position: 'absolute', inset: -6, borderRadius: 999,
              border: '2px solid var(--accent)',
              animation: 'ping 1.4s cubic-bezier(0,0,.2,1) infinite',
            }}/>
          )}
        </button>
      </div>
      <style>{`
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 75%,100% { transform: scale(1.6); opacity: 0; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      `}</style>
    </>
  );
};
