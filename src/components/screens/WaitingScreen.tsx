'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Chip, Button, SmallOutlineButton, FoodTile, Toast, Input, BackButton } from '../primitives';
import { MENU_ITEMS, ITEM_BY_ID, Order } from '@/data/menu';

// ── Stepper (per order) ────────────────────────────────────────────────────────

function StepperNode({ state, label }: { state: 'done' | 'current' | 'future'; label: string }) {
  let bg: string, content: React.ReactNode;
  if (state === 'done') {
    bg = 'var(--success)';
    content = (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 7.2 6 10l5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

function Stepper({ status }: { status: Order['status'] }) {
  const cooking = status === 'preparing' || status === 'ready' || status === 'served';
  const done = status === 'ready' || status === 'served';
  const preparingState: 'done' | 'current' = cooking ? 'done' : 'current';
  const readyState: 'done' | 'future' = done ? 'done' : 'future';
  const steps = [
    { state: 'done' as const, label: 'Placed' },
    { state: 'done' as const, label: 'Received' },
    { state: preparingState, label: 'Preparing' },
    { state: readyState, label: status === 'served' ? 'Served' : 'Ready' },
  ];
  return (
    <div style={{ position: 'relative', padding: '0 16px' }}>
      <div style={{ position: 'absolute', left: 42, right: 42, top: 14, height: 2, display: 'flex' }}>
        <div style={{ flex: 1, background: 'var(--success)' }}/>
        <div style={{ flex: 1, background: 'var(--success)' }}/>
        <div style={{ flex: 1, background: done ? 'var(--success)' : 'var(--border)' }}/>
      </div>
      <div style={{ display: 'flex', position: 'relative' }}>
        {steps.map(s => <StepperNode key={s.label} state={s.state} label={s.label} />)}
      </div>
    </div>
  );
}

// ── Live ETA countdown ─────────────────────────────────────────────────────────

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function OrderCard({ order }: { order: Order }) {
  const ready = order.status === 'ready' || order.status === 'served';
  const now = useNow(!ready);
  const remMs = Math.max(0, order.placedAt + order.etaMinutes * 60000 - now);
  const mm = Math.floor(remMs / 60000);
  const ss = Math.floor((remMs % 60000) / 1000);
  const subtotal = order.lineItems.reduce((s, li) => s + li.price * li.quantity, 0);

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
          Order {order.round}
        </div>
        <Chip size="sm">{ready ? (order.status === 'served' ? 'served' : 'ready 🎉') : order.status}</Chip>
      </div>

      <Stepper status={order.status} />

      {/* ETA */}
      <div style={{ textAlign: 'center' }}>
        {ready ? (
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--success)' }}>
            {order.status === 'served' ? 'Enjoy your meal! 🍽️' : 'Ready to serve! 🎉'}
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)' }}>
            Arriving in <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{mm}:{ss.toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>

      {/* Line items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--surface)', paddingTop: 12 }}>
        {order.lineItems.map((li, i) => {
          const meta = ITEM_BY_ID[li.id];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FoodTile emoji={meta?.emoji || '🍽️'} image={meta?.image} alt={li.name} size={38} radius={10} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--ink)' }}>
                  {li.name}{li.quantity > 1 ? <span style={{ color: 'var(--ink-3)' }}> ×{li.quantity}</span> : null}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>{li.byName}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>PKR {(li.price * li.quantity).toLocaleString()}</div>
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Subtotal</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>PKR {subtotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ── Ping waiter ─────────────────────────────────────────────────────────────────

const PING_COOLDOWN_S = 60;

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
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

const CHAI_ITEM = MENU_ITEMS.find(i => i.name === 'Peshwari Chai');

// ── Main screen ─────────────────────────────────────────────────────────────────

export function WaitingScreen() {
  const { orders, toasts, dismissToast, setScreen, showToast, addToCart, goBack, groupMembers } = useApp();

  const chaiAdded = groupMembers.some(m => m.items.some(i => i.id === CHAI_ITEM?.id));

  const handlePing = useCallback((msg: string) => {
    if (msg.trim()) showToast(`"${msg}" sent to waiter!`, undefined, true);
    else showToast('Waiter has been notified!', undefined, true);
  }, [showToast]);

  const handleAddChai = () => {
    if (!chaiAdded && CHAI_ITEM) {
      addToCart(CHAI_ITEM, 1, []);
      showToast(`${CHAI_ITEM.name} added!`, undefined, true);
    }
  };

  return (
    <ScreenFrame>
      {/* Toasts */}
      {toasts.map((t, idx) => (
        <div key={t.id} style={{ position: 'absolute', top: `calc(${52 + idx * 58}px + env(safe-area-inset-top, 0px))`, left: 16, right: 16, zIndex: 20 }}>
          <Toast message={t.message} success={t.success} onDismiss={() => dismissToast(t.id)} />
        </div>
      ))}

      <BackButton onClick={goBack} />

      {/* Scrollable content */}
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0, bottom: 34,
        overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        padding: '16px 20px 32px',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 44 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            {orders.length > 1 ? 'Your Orders' : 'Your Order'}
          </div>
          <Chip muted size="sm">Table 7</Chip>
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24,
            textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)',
          }}>
            No active orders yet. Add items from the menu and place your order.
          </div>
        ) : (
          orders.map(o => <OrderCard key={o.id} order={o} />)
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
              {CHAI_ITEM ? `${CHAI_ITEM.name} — PKR ${CHAI_ITEM.price}` : 'Peshwari Chai'}
            </div>
          </div>
          <SmallOutlineButton onClick={handleAddChai}>
            {chaiAdded ? 'Added ✓' : 'Add'}
          </SmallOutlineButton>
        </div>

        {/* Ping waiter */}
        <PingButton onPing={handlePing} />

        {/* Request bill / add more */}
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
