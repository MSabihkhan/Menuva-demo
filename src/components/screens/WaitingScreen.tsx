'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Chip, Avatar, Button, SmallOutlineButton, FoodTile, Toast, Input } from '../primitives';
import { MENU_ITEMS } from '@/data/menu';

function StepperNode({ state, label }: { state: 'done' | 'current' | 'future'; label: string }) {
  let bg, color, content;
  if (state === 'done') {
    bg = 'var(--success)'; color = '#fff';
    content = (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 7.2 6 10l5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  } else if (state === 'current') {
    bg = 'var(--accent)'; color = '#fff';
    content = <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }}/>;
  } else {
    bg = 'var(--border)'; color = 'var(--ink-3)';
    content = <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--ink-3)' }}/>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: bg, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{content}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: state === 'future' ? 'var(--ink-3)' : 'var(--ink-2)' }}>{label}</div>
    </div>
  );
}

function Stepper() {
  const { orderStatus } = useApp();
  const preparingState: 'done' | 'current' = orderStatus === 'preparing' || orderStatus === 'ready' ? 'done' : 'current';
  const readyState: 'done' | 'future' = orderStatus === 'ready' ? 'done' : 'future';
  const steps = [
    { state: 'done' as const, label: 'Placed' },
    { state: 'done' as const, label: 'Received' },
    { state: preparingState, label: 'Preparing' },
    { state: readyState, label: 'Ready' },
  ];
  return (
    <div style={{ position: 'relative', padding: '0 16px' }}>
      <div style={{ position: 'absolute', left: 42, right: 42, top: 14, height: 2, display: 'flex' }}>
        <div style={{ flex: 1, background: 'var(--success)' }}/>
        <div style={{ flex: 1, background: orderStatus === 'preparing' || orderStatus === 'ready' ? 'var(--success)' : 'var(--success)' }}/>
        <div style={{ flex: 1, background: orderStatus === 'ready' ? 'var(--success)' : 'var(--border)' }}/>
      </div>
      <div style={{ display: 'flex', position: 'relative' }}>
        {steps.map(s => <StepperNode key={s.label} state={s.state} label={s.label}/>)}
      </div>
    </div>
  );
}

function TimeRing({ minutes = 18 }: { minutes?: number }) {
  const size = 120, stroke = 2, r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--accent)" strokeWidth={stroke} fill="none"
          strokeDasharray={`${c * 0.75} ${c}`} strokeLinecap="round"/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--ink)', lineHeight: 1 }}>~{minutes}</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>min</div>
      </div>
    </div>
  );
}

function PersonRow({ avatar, name, items }: { avatar: string; name: string; items: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar initials={avatar} size={32} style={{ border: 'none' }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.35,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{name}</span> · {items}
        </div>
      </div>
      <Chip size="sm">preparing</Chip>
    </div>
  );
}

function PingButton({ cooldown = false, onClick }: { cooldown?: boolean; onClick?: () => void }) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (cooldown) {
      setCountdown(180);
      const interval = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (countdown > 0) {
    return (
      <div style={{ position: 'relative' }}>
        <Button variant="secondary" disabled style={{ opacity: 1, color: 'var(--ink-3)' }}>
          Try again in {formatTime(countdown)}
        </Button>
      </div>
    );
  }

  return (
    <Button variant="secondary" onClick={onClick}>Ping the Kitchen</Button>
  );
}

export function WaitingScreen() {
  const { groupMembers, toasts, dismissToast, setScreen, showToast, setOrderStatus, addToCart } = useApp();
  const [pingCooldown, setPingCooldown] = useState(false);
  const [message, setMessage] = useState('');
  const [chaiAdded, setChaiAdded] = useState(false);
  
  const allItems = groupMembers.flatMap(m => m.items.map(i => i.name)).join(', ');

  const handlePing = () => {
    if (message.trim()) {
      showToast(`"${message}" sent to kitchen!`, undefined, true);
      setMessage('');
    }
    setPingCooldown(true);
  };

  const handleAddMore = () => setScreen('menu');

  const handleAddChai = () => {
    if (!chaiAdded) {
      setChaiAdded(true);
      const chai = MENU_ITEMS.find(i => i.name === 'Peshwari Chai');
      if (chai) addToCart(chai, 1, []);
      showToast('Peshwari Chai added to order!');
    }
  };

  return (
    <ScreenFrame>
      {toasts.length > 0 && toasts.map(t => (
        <div key={t.id} style={{ position: 'absolute', top: 52, left: 16, right: 16, zIndex: 10 }}>
          <Toast message={t.message} success={t.success} onDismiss={() => dismissToast(t.id)} />
        </div>
      ))}
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0, bottom: 34,
        padding: '16px 20px 16px',
        display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Order Placed
          </div>
          <Chip muted size="sm">Table 7</Chip>
        </div>

        <Stepper />

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <TimeRing />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupMembers.filter(m => m.items.length > 0).map(member => (
            <PersonRow key={member.id} avatar={member.initials} name={member.name} items={member.items.map(i => i.name).join(', ')} />
          ))}
        </div>

        <div style={{
          background: 'rgba(254,243,226,0.85)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(200,118,10,0.2)',
          borderRadius: 16, padding: 14,
          display: 'flex', alignItems: 'center', gap: 12, position: 'relative',
        }}>
          <FoodTile emoji="🍵" size={44} bg="#FDEACC" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)' }}>
              Add something while you wait?
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>
              Peshwari Chai — PKR 180
            </div>
          </div>
          <SmallOutlineButton onClick={handleAddChai}>
            {chaiAdded ? 'Added!' : 'Add'}
          </SmallOutlineButton>
        </div>

        {/* Kitchen Message Input */}
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Message to Kitchen
          </div>
          <Input
            placeholder="e.g. Extra raita, no onions..."
            value={message}
            onChange={setMessage}
          />
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="secondary" onClick={handlePing} disabled={!message.trim() && !message}>
            {pingCooldown ? 'Message Sent!' : 'Send to Kitchen'}
          </Button>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--accent)', cursor: 'pointer' }} onClick={handleAddMore}>
            Add more items →
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}