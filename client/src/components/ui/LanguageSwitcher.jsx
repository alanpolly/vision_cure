import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function LanguageSwitcher() {
  const { lang, setLang, LANGS } = useLanguage();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className="bg-transparent dark:text-white text-black text-xs font-medium uppercase outline-none cursor-pointer border border-black/10 dark:border-white/10 rounded-full px-2 py-1"
      style={{ WebkitAppearance: 'none', appearance: 'none', textAlign: 'center' }}
    >
      {LANGS.map(l => (
        <option key={l.code} value={l.code} className="dark:bg-[#050505] bg-white dark:text-white text-black">
          {l.code.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
