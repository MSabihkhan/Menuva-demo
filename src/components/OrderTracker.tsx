'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

// Screens where the pill should NOT show (you're already there, or pre-join).
const HIDE_ON = new Set(['welcome', 'detail', 'viewer3d', 'waiting', 'payment']);

/**
 * Persistent, tappable order tracker. Appears across the browsing screens once
 * an order is live and counts down its ETA. Replaces the old forced redirect to
 * the Waiting screen — tap to go there instead.
 */
export function OrderTrackerPill() {
  const { orders, screen, setScreen, getCartCount } = useApp();
  const [now, setNow] = useState(() => Date.now());

  const active = orders.filter(o => o.status !== 'served');

  useEffect(() => {
    if (active.length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active.length]);

  if (active.length === 0 || HIDE_ON.has(screen)) return null;

  const anyReady = active.some(o => o.status === 'ready');
  const soonest = Math.min(...active.map(o => Math.max(0, o.placedAt + o.etaMinutes * 60000 - now)));
  const mm = Math.floor(soonest / 60000);
  const ss = Math.floor((soonest % 60000) / 1000);
  const time = `${mm}:${ss.toString().padStart(2, '0')}`;

  const label = active.length > 1
    ? `${active.length} orders working`
    : `Order ${active[0].round} · ${active[0].status}`;
  const sub = anyReady ? 'Ready to serve! 🎉' : `Arriving in ~${time}`;

  // Sit above the cart bar when there are pending items, otherwise near the bottom.
  const bottom = getCartCount() > 0 ? 100 : 44;

  return (
    <div
      onClick={() => setScreen('waiting')}
      style={{
        position: 'absolute', bottom, left: 16, right: 16, zIndex: 80,
        borderRadius: 16, padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        background: 'rgba(254,243,226,0.92)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(200,118,10,0.25)',
        boxShadow: '0 6px 24px rgba(200,118,10,0.18)',
      }}
    >
      <style>{`@keyframes pingPulse { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.4); opacity: 0; } }`}</style>
      <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--accent)' }} />
        {!anyReady && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid var(--accent)', animation: 'pingPulse 1.5s ease-out infinite',
          }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
          color: 'var(--ink)', textTransform: 'capitalize',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-2)' }}>{sub}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>
        Track →
      </div>
    </div>
  );
}

/**
 * The 5-minute-rule popup. Fires when the user adds an item more than 5 minutes
 * after the last order was placed — warning that it will go out as a new queue.
 */
export function QueueNoticePopup() {
  const { queueNotice, clearQueueNotice } = useApp();

  // Tap-to-dismiss (backdrop or "Got it") — this is a consequential notice, so we
  // wait for an explicit acknowledgement rather than auto-hiding.
  if (!queueNotice) return null;

  return (
    <div
      onClick={clearQueueNotice}
      style={{
        position: 'absolute', inset: 0, zIndex: 300,
        background: 'rgba(26,25,24,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 22, padding: '26px 22px',
          maxWidth: 320, width: '100%', textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
          animation: 'successPop 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 12 }}>⏱️</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 21, color: 'var(--ink)',
          letterSpacing: '-0.01em', marginBottom: 8,
        }}>
          Starting a new order
        </div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)',
          lineHeight: 1.55, marginBottom: 20,
        }}>
          It&apos;s been over 5 minutes since your last order. Anything you add now goes out
          as <b style={{ color: 'var(--ink)' }}>Order {queueNotice.round}</b> — it&apos;ll be
          prepared after your current order and arrive in a second round.
        </div>
        <button
          onClick={clearQueueNotice}
          style={{
            width: '100%', height: 50, borderRadius: 100,
            background: 'var(--accent)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15,
            border: 'none', cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
