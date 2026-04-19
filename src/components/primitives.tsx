'use client';

import React from 'react';

interface StatusBarProps {
  dark?: boolean;
  hidden?: boolean;
}

export function StatusBar({ dark, hidden }: StatusBarProps) {
  if (hidden) return null;
  const color = dark ? '#ffffff' : '#1A1918';
  return (
    <div style={{
      height: 44, width: '100%',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '0 24px 8px', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
      color, letterSpacing: '-0.01em',
      position: 'relative', zIndex: 2,
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          {[1,2,3,4].map((i) => (
            <rect key={i} x={(i-1)*4} y={11 - i*2.5} width="3" height={i*2.5} rx="0.6" fill={color} />
          ))}
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path d="M7.5 2.2C9.6 2.2 11.6 3 13.1 4.5l1.1-1.1C12.4 1.5 10 .5 7.5.5S2.6 1.5.8 3.4l1.1 1.1C3.4 3 5.4 2.2 7.5 2.2Z" fill={color} opacity="0.95"/>
          <path d="M7.5 5.2c1.3 0 2.5.5 3.4 1.4l1.1-1.1c-1.2-1.2-2.8-1.9-4.5-1.9-1.7 0-3.3.7-4.5 1.9l1.1 1.1c.9-.9 2.1-1.4 3.4-1.4Z" fill={color} opacity="0.95"/>
          <path d="M7.5 8.2c.5 0 1 .2 1.4.6l-1.4 1.5L6.1 8.8c.4-.4.9-.6 1.4-.6Z" fill={color}/>
        </svg>
        <svg width="27" height="12" viewBox="0 0 27 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke={color} strokeOpacity="0.4" fill="none"/>
          <rect x="2" y="2" width="19" height="8" rx="1.8" fill={color}/>
          <rect x="23.5" y="4" width="1.5" height="4" rx="0.5" fill={color} opacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}

export function HomeIndicator({ dark, hidden }: { dark?: boolean; hidden?: boolean }) {
  if (hidden) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 34,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 5,
    }}>
      <div style={{
        width: 134, height: 5, borderRadius: 999,
        background: dark ? 'rgba(255,255,255,0.3)' : 'rgba(26,25,24,0.2)',
      }}/>
    </div>
  );
}

export function BackButton({ onClick, dark }: { onClick?: () => void; dark?: boolean }) {
  const color = dark ? '#fff' : 'var(--ink)';
  return (
    <div 
      onClick={onClick}
      style={{
        position: 'absolute', top: 44, left: 16, zIndex: 10,
        width: 36, height: 36, borderRadius: '50%',
        background: dark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 5L7 10l5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  muted?: boolean;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Chip({ children, active, muted, size = 'md', style = {}, onClick }: ChipProps) {
  const pad = size === 'sm' ? '5px 10px' : '6px 12px';
  const fs = size === 'sm' ? 11 : 12;
  let bg, color, border = 'none';
  if (active) { bg = 'var(--accent)'; color = '#fff'; }
  else if (muted) { bg = 'var(--surface)'; color = 'var(--ink-2)'; border = '1px solid var(--border)'; }
  else { bg = 'var(--accent-surface)'; color = 'var(--accent)'; }
  return onClick ? (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: pad, borderRadius: 100, background: bg, color,
        fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: fs, lineHeight: 1,
        border, whiteSpace: 'nowrap', cursor: 'pointer', ...style
      }}
    >{children}</button>
  ) : (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: pad, borderRadius: 100, background: bg, color,
      fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: fs, lineHeight: 1,
      border, whiteSpace: 'nowrap', ...style
    }}>{children}</span>
  );
}

interface AvatarProps {
  initials: string;
  size?: number;
  style?: React.CSSProperties;
}

export function Avatar({ initials, size = 36, style = {} }: AvatarProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent-surface)', color: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: size === 36 ? 14 : size === 32 ? 12 : 13,
      letterSpacing: '0.02em', flexShrink: 0,
      border: '2px solid #fff',
      ...style,
    }}>{initials}</div>
  );
}

interface AvatarStackProps {
  people: { initials: string }[];
  size?: number;
}

export function AvatarStack({ people, size = 36 }: AvatarStackProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {people.map((p, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -12 }}>
          <Avatar initials={p.initials} size={size} />
        </div>
      ))}
    </div>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark-primary';
  disabled?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function Button({ children, variant = 'primary', disabled, style = {}, onClick, type = 'button' }: ButtonProps) {
  const base = {
    height: 52, borderRadius: 100, width: '100%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15,
    border: 'none', cursor: 'pointer', padding: '0 24px',
    letterSpacing: '-0.005em',
  };
  let variantStyle: React.CSSProperties = {};
  if (variant === 'primary') variantStyle = { background: 'var(--accent)', color: '#fff' };
  else if (variant === 'secondary') variantStyle = { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--border)' };
  else if (variant === 'ghost') variantStyle = { background: 'transparent', color: 'var(--error)' };
  else if (variant === 'dark-primary') variantStyle = { background: 'var(--accent)', color: '#fff' };
  if (disabled) variantStyle.opacity = 0.6;
  return (
    <button 
      type={type}
      style={{ ...base, ...variantStyle, ...style }} 
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </button>
  );
}

interface SmallOutlineButtonProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function SmallOutlineButton({ children, style = {}, onClick }: SmallOutlineButtonProps) {
  return (
    <button style={{
      height: 32, borderRadius: 100, padding: '0 14px',
      background: 'transparent', border: '1px solid var(--accent)',
      color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
      ...style,
    }} onClick={onClick}>
      {children}
    </button>
  );
}

interface InputProps {
  label?: string;
  placeholder?: string;
  caption?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
}

export function Input({ label, placeholder, caption, error, value = '', onChange, type = 'text' }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <label style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, color: 'var(--ink-2)' }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          height: 48, borderRadius: 12,
          background: error ? 'var(--error-surface)' : 'var(--surface)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          padding: '0 16px', display: 'flex', alignItems: 'center',
          fontFamily: 'var(--font-sans)', fontSize: 15,
          color: value ? 'var(--ink)' : 'var(--ink-3)',
          width: '100%',
        }}
      />
      {error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--error)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1 11 10.5H1L6 1Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/><path d="M6 5v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="9" r="0.6" fill="currentColor"/></svg>
          {error}
        </div>
      ) : caption ? (
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>{caption}</div>
      ) : null}
    </div>
  );
}

interface ToastProps {
  message: string;
  success?: boolean;
  initials?: string;
  onDismiss?: () => void;
}

export function Toast({ message, success, initials, onDismiss }: ToastProps) {
  return (
    <div style={{
      position: 'absolute', top: 52, left: 16, right: 16, zIndex: 10,
      height: 52, borderRadius: 12,
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.5)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px',
    }}>
      {success ? (
        <div style={{
          width: 24, height: 24, borderRadius: 12,
          background: 'var(--success-surface)', color: 'var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5 5 9l4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      ) : initials ? (
        <Avatar initials={initials} size={32} style={{ border: 'none' }} />
      ) : null}
      <div style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.3 }}>{message}</div>
      {onDismiss && <div style={{ color: 'var(--ink-3)', fontSize: 20, lineHeight: 1, fontWeight: 300, padding: 4, cursor: 'pointer' }} onClick={onDismiss}>×</div>}
    </div>
  );
}

export function FoodTile({ emoji, size = 80, radius = 16, bg = 'var(--surface)' }: { emoji: string; size?: number; radius?: number; bg?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.55, flexShrink: 0,
    }}>{emoji}</div>
  );
}

export function Divider({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <div style={{ height: 1, background: 'var(--border)', width: '100%', ...style }}/>
  );
}

export function TableChip({ children = 'Table 7' }: { children?: string }) {
  return <Chip muted size="sm">{children}</Chip>;
}

interface ScreenFrameProps {
  children: React.ReactNode;
  dark?: boolean;
  style?: React.CSSProperties;
}

export function ScreenFrame({ children, dark = false, style = {} }: ScreenFrameProps) {
  return (
    <div className={`screen ${dark ? 'dark' : ''}`} style={style}>
      {children}
    </div>
  );
}