'use client';

import React, { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { api } from '@/lib/api';
import { FoodTile } from '@/components/primitives';
import { ITEM_BY_ID, RESTAURANT } from '@/data/menu';
import type { Order, OrderLineItem, OrderStatus } from '@/data/menu';

const TABLE_ID = 'T7';

function toArray<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean) as T[];
  return Object.values(val as Record<string, T>);
}

function parseOrders(val: unknown): Order[] {
  if (!val) return [];
  return Object.entries(val as Record<string, Record<string, unknown>>)
    .map(([id, raw]) => ({
      id,
      round: Number(raw.round) || 1,
      placedAt: Number(raw.placedAt) || 0,
      etaMinutes: Number(raw.etaMinutes) || 18,
      status: (raw.status as OrderStatus) || 'placed',
      lineItems: toArray<OrderLineItem>(raw.lineItems),
      paid: !!raw.paid,
    }))
    .sort((a, b) => a.placedAt - b.placedAt);
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; next?: { label: string; to: OrderStatus } }> = {
  placed:    { label: 'New order',  color: '#C8760A', bg: '#FEF3E2', border: '#C8760A55', next: { label: 'Start Preparing', to: 'preparing' } },
  preparing: { label: 'Preparing',  color: '#2D6A4F', bg: '#EAF3DE', border: '#2D6A4F33', next: { label: 'Mark as Ready', to: 'ready' } },
  ready:     { label: 'Ready 🎉',   color: '#2D6A4F', bg: '#EAF3DE', border: '#2D6A4F33', next: { label: 'Complete (Served)', to: 'served' } },
  served:    { label: 'Served',     color: '#A39E99', bg: '#F0EEE9', border: '#A39E9933' },
};

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const times = [0, 0.18, 0.36];
    times.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    });
  } catch {}
}

function ConnDot({ connected }: { connected: boolean | null }) {
  const color = connected === null ? '#A39E99' : connected ? '#2D6A4F' : '#B94040';
  const label = connected === null ? 'Connecting…' : connected ? 'Live' : 'Offline';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
    </div>
  );
}

function ActionButton({ label, onClick, variant }: { label: string; onClick: () => void; variant: 'primary' | 'secondary' }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: '10px 22px', borderRadius: 10, cursor: 'pointer',
        fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 600, fontSize: 14,
        background: variant === 'primary' ? '#C8760A' : '#fff',
        color: variant === 'primary' ? '#fff' : '#1A1918',
        border: variant === 'secondary' ? '1.5px solid #D6D2CB' : 'none',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.1s ease',
        boxShadow: variant === 'primary' ? '0 2px 12px rgba(200,118,10,0.3)' : 'none',
      } as React.CSSProperties}
    >
      {label}
    </button>
  );
}

function OrderTicket({ order, onAdvance }: { order: Order; onAdvance: (to: OrderStatus) => void }) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.placed;
  const subtotal = order.lineItems.reduce((s, li) => s + li.price * li.quantity, 0);
  const tax = Math.round(subtotal * 0.16);
  const placedTime = order.placedAt ? new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  // Group items by person for the ticket.
  const byPerson = new Map<string, { name: string; items: OrderLineItem[] }>();
  for (const li of order.lineItems) {
    const g = byPerson.get(li.bySid) ?? { name: li.byName, items: [] };
    g.items.push(li);
    byPerson.set(li.bySid, g);
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${cfg.border}`, overflow: 'hidden' }}>
      <div style={{ background: cfg.bg, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1918' }}>Order {order.round}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>· {cfg.label}</div>
        </div>
        {placedTime && <div style={{ fontSize: 12, color: '#6B6560' }}>{placedTime}</div>}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...byPerson.values()].map((g, gi) => (
          <div key={gi}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6B6560', marginBottom: 4 }}>{g.name}</div>
            {g.items.map((li, i) => {
              const meta = ITEM_BY_ID[li.id];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <FoodTile emoji={meta?.emoji || '🍽️'} image={meta?.image} alt={li.name} size={36} radius={9} />
                  <span style={{ flex: 1, fontSize: 14, color: '#1A1918' }}>{li.quantity > 1 ? `${li.name} ×${li.quantity}` : li.name}</span>
                  <span style={{ color: '#6B6560', fontSize: 13 }}>PKR {(li.price * li.quantity).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F0EEE9', paddingTop: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1918' }}>Total (incl. tax)</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#C8760A' }}>PKR {(subtotal + tax).toLocaleString()}</span>
        </div>

        {cfg.next && (
          <div style={{ marginTop: 4 }}>
            <ActionButton label={cfg.next.label} onClick={() => onAdvance(cfg.next!.to)} variant="primary" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [alerting, setAlerting] = useState(false);
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const unsubConn = onValue(ref(db, '.info/connected'), snap => setConnected(snap.val() === true));

    const unsubOrders = onValue(ref(db, `tables/${TABLE_ID}/orders`), snap => {
      const next = parseOrders(snap.val());
      setOrders(next);
      setLastUpdated(new Date().toLocaleTimeString());

      // Beep when a genuinely new order appears (skip the first snapshot).
      const ids = new Set(next.map(o => o.id));
      if (seenIdsRef.current) {
        const isNew = next.some(o => !seenIdsRef.current!.has(o.id) && o.status === 'placed');
        if (isNew) {
          playBeep();
          setAlerting(true);
          setTimeout(() => setAlerting(false), 3000);
        }
      }
      seenIdsRef.current = ids;
    });

    return () => { unsubConn(); unsubOrders(); };
  }, []);

  const advance = (order: Order, to: OrderStatus) => {
    api.advanceStatus(TABLE_ID, order.id, to).catch(() => {});
  };

  const active = orders.filter(o => o.status !== 'served');
  const totalItems = active.reduce((t, o) => t + o.lineItems.reduce((s, li) => s + li.quantity, 0), 0);
  const totalAmount = active.reduce((t, o) => t + o.lineItems.reduce((s, li) => s + li.price * li.quantity, 0), 0);
  const tax = Math.round(totalAmount * 0.16);

  return (
    <div style={{ minHeight: '100vh', background: '#F0EEE9', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,118,10,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(200,118,10,0); }
        }
        .alert-pulse { animation: pulse-border 0.6s ease-in-out 5; }
      `}</style>

      {/* Header */}
      <div style={{
        background: '#1A1918', padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 22, color: '#fff', letterSpacing: '-0.01em' }}>
            {RESTAURANT.name} — Kitchen View
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            Table 7 · Real-time orders
          </div>
        </div>
        <ConnDot connected={connected} />
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1024, margin: '0 auto' }}>
        {/* Totals banner */}
        <div
          className={alerting ? 'alert-pulse' : ''}
          style={{
            background: active.length > 0 ? '#FEF3E2' : '#fff', borderRadius: 16, padding: '18px 22px',
            border: `1.5px solid ${active.length > 0 ? '#C8760A55' : '#D6D2CB'}`,
            marginBottom: 16, transition: 'background 0.4s ease, border-color 0.4s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1A1918' }}>
              {active.length === 0 ? 'Waiting for orders' : `${active.length} active order${active.length !== 1 ? 's' : ''}`}
            </div>
            {lastUpdated && <div style={{ fontSize: 12, color: '#6B6560', marginTop: 2 }}>Updated {lastUpdated}</div>}
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Items</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1918' }}>{totalItems}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>With Tax</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#C8760A' }}>PKR {(totalAmount + tax).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Tickets */}
        {orders.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 56, textAlign: 'center', color: '#A39E99', fontSize: 15 }}>
            No orders yet. Waiting for the table…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {orders.map(o => <OrderTicket key={o.id} order={o} onAdvance={(to) => advance(o, to)} />)}
          </div>
        )}
      </div>
    </div>
  );
}
