import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useDash } from '../../context/DashboardContext';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

const Logo = () => (
  <div style={{
    width: 32, height: 32, borderRadius: 10,
    background: 'linear-gradient(135deg, var(--accent), #0090A0)',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 4px 12px -4px var(--accent-glow)',
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  </div>
);

const StatusPill = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');
  return (
    <div className="row gap-2" style={{
      padding: '6px 12px', fontSize: 12, fontWeight: 500,
      background: 'var(--surface-sunken)',
      border: '1px solid var(--border)',
      borderRadius: 999, color: 'var(--text-2)',
    }}>
      <span className="t-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{hh}:{mm}</span>
    </div>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme } = useDash();
  const isDark = theme === 'dark';
  return (
    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="btn-icon" aria-label="Toggle theme" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: 18, height: 18, transform: `rotate(${isDark ? 360 : 0}deg)`, transition: 'transform 500ms cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: isDark ? 0 : 1, transform: `scale(${isDark ? 0.5 : 1})`, transition: 'all 250ms' }}>
          <Icon name="sun" size={18}/>
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: isDark ? 1 : 0, transform: `scale(${isDark ? 1 : 0.5})`, transition: 'all 250ms' }}>
          <Icon name="moon" size={18}/>
        </div>
      </div>
    </button>
  );
};

const DashHeader = () => {
  const navigate = useNavigate();
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(var(--blur)) saturate(180%)',
      WebkitBackdropFilter: 'blur(var(--blur)) saturate(180%)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      marginBottom: 'var(--s-8)',
      position: 'sticky', top: 16, zIndex: 50,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="row gap-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
        <Logo />
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Vision<span style={{ color: 'var(--accent)' }}>Cure</span>
        </div>
        <div className="chip" style={{ fontSize: 10, padding: '3px 8px', marginLeft: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--success)' }}/>
          Synced
        </div>
      </div>
      <div className="row gap-2">
        <StatusPill />
        <LanguageSwitcher />
        <ThemeToggle />
        <button className="btn-icon" aria-label="Help">
          <Icon name="help" size={18}/>
        </button>
      </div>
    </header>
  );
};

export default DashHeader;
