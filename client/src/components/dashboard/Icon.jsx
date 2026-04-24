import React from 'react';

const Icon = ({ name, size = 20, stroke = 1.6, className = '', style = {} }) => {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
    className, style,
  };
  const paths = {
    home: <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>,
    scan: <><path d="M4 7V5a1 1 0 011-1h2"/><path d="M20 7V5a1 1 0 00-1-1h-2"/><path d="M4 17v2a1 1 0 001 1h2"/><path d="M20 17v2a1 1 0 01-1 1h-2"/><path d="M8 12h8"/></>,
    pill: <><rect x="3" y="8" width="18" height="8" rx="4"/><path d="M12 8v8"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon: <path d="M20 14.5A8 8 0 119.5 4 6 6 0 0020 14.5z"/>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 17h.01"/></>,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    fork: <><path d="M8 4v7a4 4 0 008 0V4"/><path d="M4 4v3a4 4 0 004 4"/><path d="M12 15v5"/></>,
    shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></>,
    check: <path d="M5 12l5 5L20 7"/>,
    checkCircle: <><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>,
    alert: <><path d="M12 3l10 17H2L12 3z"/><path d="M12 10v4M12 18h.01"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    bell: <><path d="M6 8a6 6 0 1112 0c0 6 2 8 2 8H4s2-2 2-8"/><path d="M10 20a2 2 0 004 0"/></>,
    camera: <><rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l2-3h4l2 3"/></>,
    upload: <><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></>,
    phone: <path d="M22 16.92v2a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 3.2 2 2 0 014.1 1h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.5 2L8 8.5a16 16 0 006 6l1.1-1.1a2 2 0 012-.5c.9.3 1.8.5 2.7.6a2 2 0 011.7 2z"/>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6"/>,
    back: <path d="M19 12H5M11 6l-6 6 6 6"/>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    sparkles: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 17l.7 2 2 .7-2 .7L19 22l-.7-1.6-2-.7 2-.7L19 17z"/></>,
    leaf: <><path d="M11 20c4-1 7-4 8-8 1-4 0-7 0-8-1 0-4-1-8 0-4 1-7 4-8 8"/><path d="M3 20c6-2 10-6 12-12"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    chevronRight: <path d="M9 6l6 6-6 6"/>,
    chevronDown: <path d="M6 9l6 6 6-6"/>,
    text: <><path d="M4 6h16M4 12h10M4 18h16"/></>,
    contrast: <><circle cx="12" cy="12" r="9"/><path d="M12 3v18" fill="currentColor"/></>,
    volume: <><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16 9a4 4 0 010 6M19 6a8 8 0 010 12"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    send: <><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></>,
    qr: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/></>,
    activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
    droplet: <path d="M12 3s-6 7-6 11a6 6 0 0012 0c0-4-6-11-6-11z"/>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 000-7.8z"/>,
    close: <path d="M6 6l12 12M18 6L6 18"/>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>,
    chat: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
};

export default Icon;
