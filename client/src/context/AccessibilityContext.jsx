// ============================================
// Accessibility Context
// Provides state + logic for all 4 accessibility features:
//   1. Large Text     — scales root font size
//   2. High Contrast  — applies high-contrast color overrides
//   3. Voice Guidance — uses Web Speech API to read text
//   4. Simple Mode    — strips decorative elements
// Persists preferences in localStorage.
// ============================================
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AccessibilityContext = createContext(null);

const STORAGE_KEY = 'visioncure_accessibility';

function loadPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return {
    largeText: false,
    highContrast: false,
    voiceGuidance: false,
    simpleMode: false,
  };
}

export function AccessibilityProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPreferences);
  const speechInitialized = useRef(false);

  // Persist to localStorage whenever prefs change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  // Apply CSS classes to <html> element
  useEffect(() => {
    const html = document.documentElement;

    html.classList.toggle('large-text', prefs.largeText);
    html.classList.toggle('high-contrast', prefs.highContrast);
    html.classList.toggle('simple-mode', prefs.simpleMode);

    return () => {
      html.classList.remove('large-text', 'high-contrast', 'simple-mode');
    };
  }, [prefs.largeText, prefs.highContrast, prefs.simpleMode]);

  // Initialize speech synthesis on first user interaction
  // Chrome requires a user gesture before speechSynthesis will work
  useEffect(() => {
    const initSpeech = () => {
      if (speechInitialized.current) return;
      if (window.speechSynthesis) {
        // Force load voices
        window.speechSynthesis.getVoices();
        // Some browsers need a silent utterance to "unlock" speech
        const silent = new SpeechSynthesisUtterance('');
        silent.volume = 0;
        window.speechSynthesis.speak(silent);
        speechInitialized.current = true;
        console.log('[ACCESSIBILITY] Speech synthesis initialized.');
      }
    };

    // Listen for first user gesture
    document.addEventListener('click', initSpeech, { once: true });
    document.addEventListener('touchstart', initSpeech, { once: true });

    return () => {
      document.removeEventListener('click', initSpeech);
      document.removeEventListener('touchstart', initSpeech);
    };
  }, []);

  /**
   * Speak text aloud using Web Speech API.
   * Works regardless of voiceGuidance setting when force=true.
   */
  const speak = useCallback((text, force = false) => {
    return new Promise((resolve) => {
      if (!text) return resolve();
      if (!force && !prefs.voiceGuidance) return resolve();

      if (!window.speechSynthesis) {
        console.warn('[ACCESSIBILITY] Speech synthesis not supported in this browser.');
        return resolve();
      }

      // Cancel any ongoing speech to avoid overlap
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }

      // Chrome has a bug where speech stops after ~15 seconds.
      // Also, speechSynthesis can get "stuck" — this workaround resets it.
      const resumeIfPaused = () => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      };

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';

      // Try to pick a good voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
          || voices.find(v => v.lang.startsWith('en-US'))
          || voices.find(v => v.lang.startsWith('en'));
        if (preferred) {
          utterance.voice = preferred;
        }
      }

      utterance.onstart = () => {
        console.log('[ACCESSIBILITY] Speaking:', text.slice(0, 60) + '...');
      };

      // Workaround: keep resuming in case Chrome pauses it
      const intervalId = setInterval(resumeIfPaused, 5000);
      utterance.onend = () => {
        clearInterval(intervalId);
        resolve();
      };
      utterance.onerror = (e) => {
        clearInterval(intervalId);
        console.error('[ACCESSIBILITY] Speech error:', e.error);
        resolve();
      };

      // Delay slightly to prevent Chrome from dropping the utterance due to immediate cancel()
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    });
  }, [prefs.voiceGuidance]);

  // Toggle individual preferences
  const toggleLargeText = useCallback(() => {
    setPrefs(prev => ({ ...prev, largeText: !prev.largeText }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setPrefs(prev => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const toggleVoiceGuidance = useCallback(() => {
    setPrefs(prev => {
      const newVal = !prev.voiceGuidance;
      if (newVal) {
        // Force speak to announce it's enabled
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance('Voice guidance is now enabled.');
          utterance.rate = 0.9;
          utterance.volume = 1;
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        }
      } else {
        window.speechSynthesis?.cancel();
      }
      return { ...prev, voiceGuidance: newVal };
    });
  }, []);

  const toggleSimpleMode = useCallback(() => {
    setPrefs(prev => ({ ...prev, simpleMode: !prev.simpleMode }));
  }, []);

  const value = {
    ...prefs,
    toggleLargeText,
    toggleHighContrast,
    toggleVoiceGuidance,
    toggleSimpleMode,
    speak,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
