'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Chip, AvatarStack, Button, Input } from '../primitives';
import { RESTAURANT } from '@/data/menu';

function LogoLD() {
  return (
    <div style={{
      width: 68, height: 68, borderRadius: '50%',
      background: 'var(--accent-surface)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--accent)',
      letterSpacing: '0.02em',
      boxShadow: '0 4px 20px rgba(200,118,10,0.15)',
    }}>
      LD
    </div>
  );
}

export function WelcomeScreen() {
  const { userName, joinTable, setScreen, groupMembers } = useApp();
  const [inputName, setInputName] = useState(userName || '');
  const [error, setError] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Only show OTHER users at the table — never show the current user in this list
  const otherMembers = groupMembers.filter(m => !m.isCurrentUser && m.name);
  const isReturning = !!userName;

  const handleJoin = async () => {
    if (!inputName.trim()) {
      setError(true);
      setTouched(true);
      return;
    }
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
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0, bottom: 34,
        padding: '0 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Hero */}
        <div style={{
          width: '100%', marginTop: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 0,
        }}>
          <LogoLD />

          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)',
            marginTop: 14, letterSpacing: '-0.02em', lineHeight: 1.1, textAlign: 'center',
          }}>
            {RESTAURANT.name}
          </div>

          <div style={{ marginTop: 8 }}>
            <Chip muted size="sm">{RESTAURANT.table}</Chip>
          </div>

          {/* Others already at the table */}
          {otherMembers.length > 0 && (
            <div style={{
              marginTop: 28, width: '100%',
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
              border: '1px solid rgba(232,230,225,0.6)',
            }}>
              <AvatarStack people={otherMembers.map(m => ({ initials: m.initials }))} size={34} />
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 14,
                color: 'var(--ink-2)', lineHeight: 1.35,
              }}>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {otherMembers.map(m => m.name).join(' & ')}
                </span>{' '}
                {otherMembers.length === 1 ? 'is' : 'are'} already here
              </div>
            </div>
          )}

          <div style={{ width: '100%', marginTop: 28 }}>
            <Input
              label="Your first name"
              placeholder="e.g. Sara"
              caption={
                !touched
                  ? (mounted && isReturning)
                    ? `Welcome back, ${userName}! Tap to continue.`
                    : 'So everyone knows who ordered what'
                  : undefined
              }
              error={touched && error ? 'We need something to call you' : undefined}
              value={inputName}
              onChange={v => { setInputName(v); setError(false); setTouched(true); }}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 'auto', width: '100%', paddingBottom: 28 }}>
          <Button
            disabled={!inputName.trim() || isLoading}
            onClick={handleJoin}
          >
            {isLoading
              ? 'Joining…'
              : isReturning && inputName.trim() === userName
                ? `Continue as ${userName}`
                : 'Join the Table'}
          </Button>
        </div>
      </div>
    </ScreenFrame>
  );
}
