'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Chip, Avatar, AvatarStack, Button, Input } from '../primitives';
import { RESTAURANT } from '@/data/menu';

function LogoLD() {
  return (
    <div
      style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)',
        letterSpacing: '0.02em',
      }}
    >
      LD
    </div>
  );
}

export function WelcomeScreen() {
  const { userName, setUserName, hasGroup, setHasGroup, setScreen, groupMembers } = useApp();
  const [inputName, setInputName] = useState(userName);
  const [error, setError] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userName) setInputName(userName);
  }, [userName]);

  const handleJoin = () => {
    if (!inputName.trim()) {
      setError(true);
      setTouched(true);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setUserName(inputName.trim());
      setScreen('menu');
    }, 300);
  };

  return (
    <ScreenFrame>
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0, bottom: 34,
        padding: '0 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ width: '100%', marginTop: 140, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LogoLD />
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)',
            marginTop: 12, letterSpacing: '-0.01em', lineHeight: 1.2,
          }}>{RESTAURANT.name}</div>
          <div style={{ marginTop: 8 }}><Chip muted size="sm">{RESTAURANT.table}</Chip></div>

          {hasGroup && (
            <div style={{
              marginTop: 24, width: '100%',
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
            }}>
              <AvatarStack people={groupMembers.map(m => ({ initials: m.initials }))} size={36} />
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.3 }}>
                {groupMembers.map(m => m.name).join(' & ')} are already here
              </div>
            </div>
          )}

          <div style={{ width: '100%', marginTop: 24 }}>
            <Input
              label="Your first name"
              placeholder="e.g. Sara"
              caption={!touched ? 'So we know who ordered what' : undefined}
              error={touched && error ? 'We need something to call you' : undefined}
              value={inputName}
              onChange={(v) => { setInputName(v); setError(false); setTouched(true); }}
            />
          </div>
        </div>

        <div style={{ marginTop: 'auto', width: '100%', paddingBottom: 24 }}>
          <Button 
            disabled={!inputName.trim() || isLoading} 
            onClick={handleJoin}
          >
            {isLoading ? 'Joining...' : 'Join the Table'}
          </Button>
        </div>
      </div>
     
    </ScreenFrame>
  );
}