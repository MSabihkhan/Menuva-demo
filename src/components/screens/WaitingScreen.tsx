'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Chip, Avatar, Button, SmallOutlineButton, FoodTile, Toast, Input, BackButton } from '../primitives';
import { MENU_ITEMS } from '@/data/menu';

function StepperNode({ state, label }: { state: 'done' | 'current' | 'future'; label: string }) {
  let bg: string, content: React.ReactNode;
  if (state === 'done') {
    bg = 'var(--success)';
    content = (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 7.2 6 10l5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  } else if (state === 'current') {
    bg = 'var(--accent)';
    content = <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }}/>;
  } else {
    bg = 'var(--border)';
    content = <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--ink-3)' }}/>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{content}</div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 11,
        color: state === 'future' ? 'var(--ink-3)' : 'var(--ink-2)',
        textAlign: 'center',
      }}>{label}</div>
    </div>
  );
}

function Stepper({ orderStatus }: { orderStatus: string }) {
  const preparingState: 'done' | 'current' =
    orderStatus === 'preparing' || orderStatus === 'ready' ? 'done' : 'current';
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
        <div style={{ flex: 1, background: 'var(--success)' }}/>
        <div style={{ flex: 1, background: readyState === 'done' ? 'var(--success)' : 'var(--border)' }}/>
      </div>
      <div style={{ display: 'flex', position: 'relative' }}>
        {steps.map(s => <StepperNode key={s.label} state={s.state} label={s.label} />)}
      </div>
    </div>
  );
}

function TimeRing({ minutes = 18 }: { minutes?: number }) {
  const size = 120, stroke = 2.5, r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--accent)" strokeWidth={stroke} fill="none"
          strokeDasharray={`${c * 0.72} ${c}`} strokeLinecap="round"/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--ink)', lineHeight: 1 }}>~{minutes}</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>min</div>
      </div>
    </div>
  );
}

const PING_COOLDOWN_S = 60; // 1 minute

function PingButton({ onPing }: { onPing: (msg: string) => void }) {
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');

  const startCooldown = useCallback(() => {
    onPing(message);
    setMessage('');
    setCountdown(PING_COOLDOWN_S);
  }, [message, onPing]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const mm = Math.floor(countdown / 60);
  const ss = countdown % 60;
  const timeLabel = countdown > 0 ? `${mm}:${ss.toString().padStart(2, '0')}` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Message to Waiter (optional)
      </div>
      <Input
        placeholder="e.g. Extra raita, no onions…"
        value={message}
        onChange={setMessage}
      />
      {countdown > 0 ? (
        <button disabled style={{
          height: 52, borderRadius: 100, width: '100%', border: '1.5px solid var(--border)',
          background: 'transparent', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15,
          color: 'var(--ink-3)', cursor: 'not-allowed', opacity: 0.8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Ping again in {timeLabel}
        </button>
      ) : (
        <Button variant="secondary" onClick={startCooldown}>
          🔔 Ping Waiter
        </Button>
      )}
    </div>
  );
}

export function WaitingScreen() {
  const { groupMembers, toasts, dismissToast, setScreen, showToast, orderStatus, addToCart, goBack } = useApp();
  const [chaiAdded, setChaiAdded] = useState(false);

  const handlePing = useCallback((msg: string) => {
    if (msg.trim()) {
      showToast(`"${msg}" sent to waiter!`, undefined, true);
    } else {
      showToast('Waiter has been notified!', undefined, true);
    }
  }, [showToast]);

  const handleAddChai = () => {
    if (!chaiAdded) {
      setChaiAdded(true);
      const chai = MENU_ITEMS.find(i => i.name === 'Peshwari Chai');
      if (chai) addToCart(chai, 1, []);
      showToast('Peshwari Chai added!', undefined, true);
    }
  };

  const membersWithItems = groupMembers.filter(m => m.items.length > 0);

  return (
    <ScreenFrame>
      {/* Toasts */}
      {toasts.map((t, idx) => (
        <div key={t.id} style={{ position: 'absolute', top: 52 + idx * 58, left: 16, right: 16, zIndex: 20 }}>
          <Toast message={t.message} success={t.success} onDismiss={() => dismissToast(t.id)} />
        </div>
      ))}

      {/* Back to menu */}
      <BackButton onClick={goBack} />

      {/* Scrollable content */}
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0, bottom: 34,
        overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        padding: '16px 20px 32px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 44 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Order Placed
          </div>
          <Chip muted size="sm">Table 7</Chip>
        </div>

        {/* Stepper */}
        <Stepper orderStatus={orderStatus} />

        {/* Time ring */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TimeRing />
        </div>

        {/* Per-member status */}
        {membersWithItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {membersWithItems.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={member.initials} size={32} style={{ border: 'none', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.35,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{member.name}</span>
                    {' · '}
                    {member.items.map(i => i.name).join(', ')}
                  </div>
                </div>
                <Chip size="sm">preparing</Chip>
              </div>
            ))}
          </div>
        )}

        {/* Chai upsell */}
        <div style={{
          background: 'rgba(254,243,226,0.9)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(200,118,10,0.2)',
          borderRadius: 16, padding: 14,
          display: 'flex', alignItems: 'center', gap: 12,
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
            {chaiAdded ? 'Added ✓' : 'Add'}
          </SmallOutlineButton>
        </div>

        {/* Ping waiter section */}
        <PingButton onPing={handlePing} />

        {/* Request bill */}
        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: 20,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <Button onClick={() => setScreen('payment')}>
            Request Bill
          </Button>
          <div
            style={{
              textAlign: 'center', fontFamily: 'var(--font-sans)', fontWeight: 500,
              fontSize: 14, color: 'var(--accent)', cursor: 'pointer', padding: '4px 0',
            }}
            onClick={() => setScreen('menu')}
          >
            + Add more items
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
