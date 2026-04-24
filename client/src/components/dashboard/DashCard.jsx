import React from 'react';

export const Card = ({ children, as: Tag = 'div', strong = false, style = {}, className = '', onClick, ...props }) => (
  <Tag
    onClick={onClick}
    className={(strong ? 'glass-strong ' : 'glass ') + className}
    style={{ padding: 'var(--s-6)', ...(onClick ? { cursor: 'pointer' } : {}), ...style }}
    {...props}
  >
    {children}
  </Tag>
);

export const SectionHeader = ({ title, action, icon }) => (
  <div className="row between" style={{ marginBottom: 'var(--s-4)', marginTop: 'var(--s-2)' }}>
    <div className="row gap-2">
      {icon && <span style={{ color: 'var(--text-3)' }}>{icon}</span>}
      <h2 className="t-micro" style={{ margin: 0, color: 'var(--text-3)' }}>{title}</h2>
    </div>
    {action}
  </div>
);

export const TextReveal = ({ text, style, className }) => (
  <span className={`text-reveal ${className || ''}`} style={style}>
    {text.split('').map((char, i) => (
      <span className="text-reveal-char" style={{ '--index': i }} key={i}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))}
  </span>
);
