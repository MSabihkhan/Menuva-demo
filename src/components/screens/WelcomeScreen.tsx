'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, AvatarStack, Button, Input } from '../primitives';
import { RESTAURANT } from '@/data/menu';

export function WelcomeScreen() {
  const { userName, joinTable, setScreen, groupMembers } = useApp();
  const [inputName, setInputName] = useState(userName || '');
  const [error, setError] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const otherMembers = groupMembers.filter(m => !m.isCurrentUser && m.name);
  const isReturning = !!userName;

  const handleJoin = async () => {
    if (!inputName.trim()) { setError(true); setTouched(true); return; }
    setIsLoading(true);
    try {
      await joinTable(inputName.trim());
      setScreen('menu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <ScreenFrame>
      {/* Warm hero */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '48%',
        background: 'linear-gradient(150deg, #C8760A 0%, #A8620C 50%, #6F410D 100%)',
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: 10, left: -40, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{
          position: 'absolute', top: 'calc(64px + env(safe-area-inset-top, 0px))', left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px',
        }}>
          <div style={{
            width: 74, height: 74, borderRadius: 22,
            background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 28, color: '#fff', letterSpacing: '0.02em',
            boxShadow: '0 12px 30px -10px rgba(0,0,0,0.4)',
          }}>LD</div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: '#fff', marginTop: 18, letterSpacing: '-0.02em', lineHeight: 1.05, textAlign: 'center' }}>
            {RESTAURANT.name}
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8, textAlign: 'center' }}>
            Order together at the table, in real time
          </div>
        </div>
      </div>

      {/* Form sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: '43%',
        background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '24px 24px calc(28px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -16px 40px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 6, background: 'var(--accent-surface)', color: 'var(--accent)', borderRadius: 100, padding: '6px 12px', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12 }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1a4.5 4.5 0 0 0-4.5 4.5C2.5 9 7 13 7 13s4.5-4 4.5-7.5A4.5 4.5 0 0 0 7 1Z" stroke="currentColor" strokeWidth="1.3" fill="none"/><circle cx="7" cy="5.4" r="1.5" fill="currentColor"/></svg>
          {RESTAURANT.table}
        </div>

        {otherMembers.length > 0 && (
          <div style={{
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--border)',
          }}>
            <AvatarStack people={otherMembers.map(m => ({ initials: m.initials }))} size={34} />
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.35 }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{otherMembers.map(m => m.name).join(' & ')}</span>{' '}
              {otherMembers.length === 1 ? 'is' : 'are'} already here
            </div>
          </div>
        )}

        <div style={{ marginTop: 22 }}>
          <Input
            label="Your first name"
            placeholder="e.g. Sara"
            caption={!touched ? ((mounted && isReturning) ? `Welcome back, ${userName}!` : 'So everyone knows who ordered what') : undefined}
            error={touched && error ? 'We need something to call you' : undefined}
            value={inputName}
            onChange={v => { setInputName(v); setError(false); setTouched(true); }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Button disabled={!inputName.trim() || isLoading} onClick={handleJoin}>
            {isLoading ? 'Joining…' : isReturning && inputName.trim() === userName ? `Continue as ${userName}` : 'Join the Table'}
          </Button>
        </div>
      </div>
    </ScreenFrame>
  );
}
