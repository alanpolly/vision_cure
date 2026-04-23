import React, { useState, useEffect, useRef } from 'react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

function HoldToTalkButton() {
  const { status, transcript, chatHistory, error, startRecording, stopRecording, submitText, cancelSpeech } = useVoiceAssistant();
  const [isPressing, setIsPressing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // Auto-open chat when a message arrives
  useEffect(() => {
    if (chatHistory.length > 0) {
      setIsChatOpen(true);
    }
  }, [chatHistory]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, status, isChatOpen]);

  const handleToggleMic = (e) => {
    e.preventDefault();
    if (status === 'idle') {
      startRecording();
    } else if (status === 'recording') {
      stopRecording();
    } else if (status === 'speaking') {
      cancelSpeech();
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && status !== 'thinking') {
      submitText(inputText);
      setInputText('');
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-4">
      {/* Chat / Status Panel */}
      {(isChatOpen || status !== 'idle' || error) && (
        <div className="vc-glass p-4 rounded-3xl shadow-2xl w-[320px] max-h-[400px] flex flex-col mb-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 mb-3">
            <h3 className="font-bold text-primary tracking-wide text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">forum</span>
              Assistant Chat
            </h3>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-slate-400 hover:text-slate-700 transition"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 vc-scrollbar">
            {chatHistory.length === 0 && status === 'idle' && !error && (
              <div className="text-center text-slate-500 text-sm py-4 italic">
                Hold the mic to start talking.
              </div>
            )}
            
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`
                  max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-primary text-white rounded-br-sm' 
                    : 'bg-white text-slate-700 rounded-bl-sm border border-slate-100'}
                `}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-medium px-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {/* Live Status Indicators */}
            {status === 'recording' && (
              <div className="flex items-center gap-2 text-primary font-bold text-sm bg-white/50 w-fit px-3 py-2 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Listening...
              </div>
            )}
            {status === 'thinking' && (
              <div className="flex items-center gap-2 text-tertiary font-bold italic text-sm w-fit px-3 py-2 rounded-full">
                <span className="material-symbols-outlined animate-spin text-base">sync</span>
                Thinking...
              </div>
            )}
            {status === 'speaking' && (
              <div className="flex items-center gap-2 text-secondary font-bold text-sm bg-white/50 w-fit px-3 py-2 rounded-full">
                <span className="material-symbols-outlined animate-pulse text-base">graphic_eq</span>
                Speaking...
              </div>
            )}
            {error && (
              <div className="text-error text-sm font-medium bg-red-50 p-2 rounded-lg">
                Error: {error}
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={chatEndRef} />
          </div>

          {/* Typing Bar */}
          <form onSubmit={handleTextSubmit} className="flex flex-shrink-0 items-center gap-2 border-t border-slate-200/50 pt-3 mt-3">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask or command..."
              disabled={status === 'thinking'}
              className="flex-1 bg-white border border-slate-200 shadow-sm rounded-full px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || status === 'thinking'}
              className="bg-primary hover:bg-primary-dim text-white w-9 h-9 rounded-full flex flex-shrink-0 items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      )}

      {/* The Button */}
      <div className="relative group">
        {/* Ripple rings when recording */}
        {status === 'recording' && (
          <>
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <div className="absolute -inset-2 rounded-full bg-primary/10 animate-ping delay-150"></div>
          </>
        )}

        <button
          onClick={handleToggleMic}
          onContextMenu={(e) => e.preventDefault()} // Disable long-press menu on mobile
          disabled={status === 'thinking'}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 select-none
            ${status === 'recording' ? 'bg-primary scale-110 shadow-primary/40' : 
              status === 'thinking' ? 'bg-tertiary animate-pulse opacity-80 cursor-wait' :
              status === 'speaking' ? 'bg-secondary animate-bounce' :
              'bg-white border-2 border-primary text-primary hover:bg-slate-50'}
          `}
          style={{ touchAction: 'none' }}
        >
          <span className={`material-symbols-outlined text-3xl ${status === 'idle' ? 'text-primary' : 'text-white'}`}>
            {status === 'recording' ? 'mic' : 
             status === 'thinking' ? 'hourglass_empty' :
             status === 'speaking' ? 'close' :
             'mic_none'}
          </span>
          
          {/* Label for tap help */}
          {status === 'idle' && (
            <div className="absolute -left-32 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md font-bold uppercase tracking-widest whitespace-nowrap">
                Tap to Talk
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default HoldToTalkButton;
