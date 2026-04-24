import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useLanguage } from '../../context/LanguageContext';



const DashBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const items = [
    { path: '/dashboard', label: t('home'), icon: 'home' },
    { path: '/scan', label: t('scan'), icon: 'scan' },
    { path: '/medications', label: t('meds'), icon: 'pill' },
    { path: '/profile', label: t('profile'), icon: 'user' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 24, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 4, padding: 6,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: '1px solid var(--border)',
      borderRadius: 999,
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100,
    }}>
      {items.map(it => {
        const active = location.pathname === it.path;
        return (
          <button
            key={it.path}
            onClick={() => navigate(it.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 999,
              fontSize: 13, fontWeight: 500,
              background: active ? 'var(--text)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--text-3)',
              transition: 'all 200ms cubic-bezier(.4,0,.2,1)',
            }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={it.icon} size={16} stroke={1.8}/>
            {active && <span>{it.label}</span>}
          </button>
        );
      })}
    </nav>
  );
};

export default DashBottomNav;
