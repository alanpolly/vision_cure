import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Custom hook to handle voice assistant logic:
 * 1. Record audio from microphone
 * 2. Transcribe audio via server (Groq Whisper)
 * 3. Chat with assistant via server (Groq Llama)
 * 4. Convert reply to speech via server (ElevenLabs)
 * 5. Play result
 */
export function useVoiceAssistant() {
  const [status, setStatus] = useState('idle'); // idle | recording | thinking | speaking
  const [transcript, setTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const accessibility = useAccessibility();
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  const cancelSpeech = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
  }, []);

  const startRecording = useCallback(async () => {
    // Prevent starting if already recording or thinking
    if (status !== 'idle' && status !== 'speaking') return;

    // Stop current speech before starting to listen (prevents audio feedback loop)
    cancelSpeech();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStatus('recording');
      setError(null);
      console.log('[VOICE] Recording started');
    } catch (err) {
      console.error('[VOICE] Microphone error:', err);
      setError('Microphone access denied or not found.');
      setStatus('idle');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      console.log('[VOICE] Recording stopped');
    }
  }, []);

  const handleConversation = async (userText) => {
    setStatus('thinking');
    setError(null);
    try {
      setChatHistory(prev => [...prev, { role: 'user', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      console.log('[VOICE] User said:', userText);

      // 2. Chat
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText }),
      });
      const chatData = await chatRes.json();
      
      if (!chatRes.ok || !chatData.answer) throw new Error('Chat failed');
      const assistantReply = chatData.answer;
      setChatHistory(prev => [...prev, { role: 'assistant', text: assistantReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      console.log('[VOICE] Assistant replied:', assistantReply);

      // Execute App Action if present
      if (chatData.action) {
        console.log('[VOICE] Executing LLM intent:', chatData.action);
        const { action, target } = chatData.action;
        if (action === 'NAVIGATE' && target) {
          navigate(target);
        } else if (action === 'AUTO_SCAN') {
          navigate('/scan', { state: { autoStartScan: true } });
        } else if (action === 'TOGGLE_SETTING' && target) {
          if (target === 'large_text') accessibility.toggleLargeText();
          if (target === 'high_contrast') accessibility.toggleHighContrast();
          if (target === 'voice_guidance') accessibility.toggleVoiceGuidance();
          if (target === 'simple_mode') accessibility.toggleSimpleMode();
        } else if (action === 'CALL_NURSE') {
          window.location.href = 'tel:6207095007';
        }
      }

      // 3. Speak
      setStatus('speaking');
      const speakRes = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: assistantReply }),
      });

      if (!speakRes.ok) {
        console.warn('[VOICE] Server-side TTS failed, falling back to browser speech.');
        const utterance = new SpeechSynthesisUtterance(assistantReply);
        utterance.onend = () => setStatus('idle');
        utterance.onerror = () => setStatus('idle');
        window.speechSynthesis.speak(utterance);
        return;
      }

      const audioBlobOutput = await speakRes.blob();
      const audioUrl = URL.createObjectURL(audioBlobOutput);
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        setStatus('idle');
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();

    } catch (err) {
      console.error('[VOICE] Processing error:', err);
      setError(err.message);
      setStatus('idle');
    }
  };

  const processAudio = async (audioBlob) => {
    setStatus('thinking');
    setError(null);
    try {
      // 1. Transcribe
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeRes = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });
      const transcribeData = await transcribeRes.json();
      
      if (!transcribeRes.ok) throw new Error(transcribeData.message || 'Transcription failed');
      
      const userText = transcribeData.text;
      setTranscript(userText);
      
      // Proceed to chat
      await handleConversation(userText);

    } catch (err) {
      console.error('[VOICE] Transcription error:', err);
      setError(err.message);
      setStatus('idle');
    }
  };

  const submitText = async (text) => {
    if (!text.trim() || (status !== 'idle' && status !== 'speaking')) return;
    cancelSpeech();
    await handleConversation(text);
  };


  return {
    status,
    transcript,
    chatHistory,
    error,
    startRecording,
    stopRecording,
    submitText,
    cancelSpeech
  };
}
