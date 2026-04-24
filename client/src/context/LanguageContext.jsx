import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

const LANG_KEY = 'visioncure_lang';
const LANGS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
];

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || 'en');

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem(LANG_KEY, code);
  };

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, LANGS }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
