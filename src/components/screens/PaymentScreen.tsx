'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, BackButton, Divider, FoodTile } from '../primitives';
import { api } from '@/lib/api';
import { ITEM_BY_ID, MemberPayment } from '@/data/menu';

type PayStep = 'split' | 'share' | 'pay' | 'status' | 'success';
type SplitMethod = 'equal' | 'own' | 'one' | 'custom';
type PayMethod = 'jazz' | 'easy' | 'card';

interface BillItem { name: string; price: number; quantity: number; emoji?: string; image?: string }
interface BillGroup { sid: string; name: string; initials: string; items: BillItem[]; isMe: boolean }

const PAY_METHOD_LABELS: Record<string, string> = { jazz: 'JazzCash', easy: 'EasyPaisa', card: 'Card' };

// ── Small shared UI ───────────────────────────────────────────────────────────

function SheetHandle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
    </div>
  );
}

function Av({ initials, size = 32, highlight }: { initials: string; size?: number; highlight?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: highlight ? 'var(--accent)' : 'var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', fontWeight: 700,
      fontSize: size * 0.37, color: highlight ? '#fff' : 'var(--ink-2)', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function PayLogo({ name, color }: { name: string; color?: string }) {
  return (
    <div style={{
      width: 44, height: 30, borderRadius: 7,
      background: 'var(--surface)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, color: color || 'var(--ink-2)',
      letterSpacing: '0.04em', flexShrink: 0,
    }}>{name}</div>
  );
}

function PayOption({ label, logo, color, selected, onClick }: {
  label: string; logo: string; color?: string; selected?: boolean; onClick?: () => void;
}) {
  return (
    <div
      style={{
        height: 56, borderRadius: 12, background: '#fff',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer', transition: 'border-color 0.15s ease',
      }}
      onClick={onClick}
    >
      <PayLogo name={logo} color={color} />
      <div style={{ flex: 1, fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: 'var(--ink)' }}>
        {label}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--accent)' }} />}
      </div>
    </div>
  );
}

function BillCard({ group }: { group: BillGroup }) {
  const subtotal = group.items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div style={{
      background: group.isMe ? 'var(--accent-surface)' : 'var(--surface)',
      borderRadius: 14,
      border: `1px solid ${group.isMe ? 'rgba(200,118,10,0.25)' : 'var(--border)'}`,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Av initials={group.initials} size={32} highlight={group.isMe} />
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--ink)', flex: 1 }}>
          {group.name}{group.isMe ? ' (you)' : ''}
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>
          PKR {subtotal.toLocaleString()}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {group.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FoodTile emoji={item.emoji || '🍽️'} image={item.image} alt={item.name} size={36} radius={9} />
            <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--ink)' }}>
              {item.name}{item.quantity > 1 ? <span style={{ color: 'var(--ink-3)' }}> ×{item.quantity}</span> : null}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>
              PKR {(item.price * item.quantity).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Success state (solo) ──────────────────────────────────────────────────────

function SuccessState({ amount, payMethod, items, onDone, onSendReceipt }: {
  amount: number; payMethod: string;
  items: BillItem[];
  onDone: () => void;
  onSendReceipt: () => void;
}) {
  const orderNumber = React.useRef(Date.now().toString(36).toUpperCase().slice(-6)).current;
  return (
    <div style={{
      flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '28px 24px 16px', gap: 20,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'var(--success-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'successPop 0.4s cubic-bezier(0.34,1.56,0.64,1)', flexShrink: 0,
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M7 17 13 23 25 11" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          Payment received!
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>
          Order #{orderNumber} · via {PAY_METHOD_LABELS[payMethod] ?? payMethod}
        </div>
      </div>
      {items.length > 0 && (
        <div style={{ width: '100%', background: 'var(--surface)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 11,
            color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
          }}>Receipt</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)' }}>
                <span>{item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name}</span>
                <span>PKR {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Total paid</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
              PKR {amount.toLocaleString()}
            </span>
          </div>
        </div>
      )}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <button
          style={{ width: '100%', height: 52, borderRadius: 100, background: 'var(--ink)', color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer' }}
          onClick={onDone}
        >Done — New Session</button>
        <button
          style={{ width: '100%', height: 44, borderRadius: 100, background: 'transparent', color: 'var(--ink-2)', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, border: '1.5px solid var(--border)', cursor: 'pointer' }}
          onClick={onSendReceipt}
        >📱 Send receipt to my phone</button>
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>
        Thanks for dining with us! 🍽️
      </div>
    </div>
  );
}

// ── Split method step ──────────────────────────────────────────────────────────

const SPLIT_OPTIONS: { id: SplitMethod; title: string; getSub: (total: number, count: number) => string }[] = [
  { id: 'equal', title: 'Split equally', getSub: (total, count) => `Everyone pays the same — PKR ${Math.round(total / count).toLocaleString()} each` },
  { id: 'own', title: 'Pay for your own items', getSub: () => 'You pay only for what you ordered' },
  { id: 'one', title: 'One person pays', getSub: (total) => `Cover it all — PKR ${total.toLocaleString()}` },
  { id: 'custom', title: 'Custom amounts', getSub: () => 'Set exactly who pays what' },
];

function StepSplit({ method, setMethod, onNext, tableTotal, peopleCount }: {
  method: SplitMethod; setMethod: (m: SplitMethod) => void;
  onNext: () => void; tableTotal: number; peopleCount: number;
}) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 4 }}>
          How should we split it?
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)' }}>
          Total bill <strong style={{ color: 'var(--ink)' }}>PKR {tableTotal.toLocaleString()}</strong> · {peopleCount} {peopleCount === 1 ? 'person' : 'friends'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SPLIT_OPTIONS.map(opt => {
          const on = method === opt.id;
          return (
            <button key={opt.id} onClick={() => setMethod(opt.id)} style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px',
              borderRadius: 14, background: '#fff',
              border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
              boxShadow: on ? '0 6px 16px -8px rgba(200,118,10,0.3)' : 'none',
              transition: 'border-color .15s, box-shadow .15s',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink)', fontSize: 15 }}>{opt.title}</div>
                <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-3)', fontSize: 13, marginTop: 2 }}>
                  {opt.getSub(tableTotal, peopleCount)}
                </div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: on ? 'none' : `1.5px solid var(--border)`,
                background: on ? 'var(--accent)' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13, fontWeight: 700,
              }}>
                {on ? '✓' : ''}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 20 }}>
        <button onClick={onNext} style={{
          width: '100%', height: 52, borderRadius: 100, background: 'var(--accent)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 20px -8px rgba(200,118,10,0.5)',
        }}>See your share →</button>
      </div>
    </div>
  );
}

// ── Share step ─────────────────────────────────────────────────────────────────

function LabelRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600, marginTop: 16, marginBottom: 2 }}>
      {children}
    </div>
  );
}

function LineRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '8px 0' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--accent-surface)', border: '1px solid rgba(200,118,10,0.2)', borderRadius: 13, padding: '12px 14px', marginTop: 12, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--accent)', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function computeAllAmounts(method: SplitMethod, groups: BillGroup[], tableTotal: number, customAmounts: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  if (method === 'own') {
    groups.forEach(g => { result[g.sid] = Math.round(g.items.reduce((s, i) => s + i.price * i.quantity, 0) * 1.16); });
  } else if (method === 'one') {
    groups.forEach(g => { result[g.sid] = g.isMe ? tableTotal : 0; });
  } else if (method === 'custom') {
    groups.forEach(g => { result[g.sid] = customAmounts[g.sid] ?? 0; });
  } else {
    // equal
    const base = Math.floor(tableTotal / groups.length);
    const rem = tableTotal - base * groups.length;
    groups.forEach((g, i) => { result[g.sid] = base + (i < rem ? 1 : 0); });
  }
  return result;
}

function StepShare({ method, groups, myGroup, tableTotal, customAmounts, setCustomAmounts, onNext }: {
  method: SplitMethod; groups: BillGroup[]; myGroup: BillGroup | null;
  tableTotal: number; customAmounts: Record<string, number>;
  setCustomAmounts: (a: Record<string, number>) => void;
  onNext: (youPay: number, items: BillItem[], allAmounts: Record<string, number>) => void;
}) {
  const mySubtotal = myGroup ? myGroup.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;
  const myTax = Math.round(mySubtotal * 0.16);

  const allAmounts = computeAllAmounts(method, groups, tableTotal, customAmounts);
  const youPay = myGroup ? (allAmounts[myGroup.sid] ?? 0) : 0;

  const customTotal = Object.values(customAmounts).reduce((s, v) => s + v, 0);
  const customValid = method !== 'custom' || customTotal === tableTotal;

  const methodLabel = SPLIT_OPTIONS.find(s => s.id === method)?.title ?? '';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Av initials={myGroup?.initials ?? 'ME'} size={34} highlight />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Your share</div>
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 4, marginLeft: 44 }}>{methodLabel}</div>

      {method === 'own' && (
        <>
          <LabelRow>Your items</LabelRow>
          {(myGroup?.items ?? []).map((it, i) => (
            <LineRow key={i} label={`${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ''}`} value={`PKR ${(it.price * it.quantity).toLocaleString()}`} />
          ))}
          <LabelRow>Tax (16%)</LabelRow>
          <LineRow label="Your tax share" value={`PKR ${myTax.toLocaleString()}`} />
        </>
      )}

      {method === 'equal' && (
        <>
          <LabelRow>Split equally</LabelRow>
          <LineRow label={`PKR ${tableTotal.toLocaleString()} ÷ ${groups.length} ${groups.length === 1 ? 'person' : 'people'}`} value={`PKR ${Math.round(tableTotal / groups.length).toLocaleString()}`} />
          {tableTotal % groups.length !== 0 && (
            <InfoBox>Any rounding difference is distributed fairly across the group — nobody overpays.</InfoBox>
          )}
        </>
      )}

      {method === 'one' && (
        <>
          <LabelRow>You cover the full order</LabelRow>
          <LineRow label="Full table total" value={`PKR ${tableTotal.toLocaleString()}`} bold />
          {groups.filter(g => !g.isMe).length > 0 && (
            <InfoBox>
              {groups.filter(g => !g.isMe).map(g => g.name).join(', ')} {groups.filter(g => !g.isMe).length === 1 ? 'owes' : 'owe'} <strong>PKR 0 now</strong> and can settle up with you later.
            </InfoBox>
          )}
        </>
      )}

      {method === 'custom' && (
        <>
          <LabelRow>Set who pays what</LabelRow>
          {groups.map(g => (
            <div key={g.sid} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
              <Av initials={g.initials} size={28} highlight={g.isMe} />
              <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)' }}>{g.name}{g.isMe ? ' · you' : ''}</span>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid var(--border)`, borderRadius: 10, padding: '5px 10px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-3)', fontSize: 13, marginRight: 4 }}>PKR</span>
                <input
                  type="number"
                  value={customAmounts[g.sid] ?? 0}
                  onChange={e => setCustomAmounts({ ...customAmounts, [g.sid]: Math.max(0, Number(e.target.value) || 0) })}
                  style={{ width: 72, border: 'none', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', textAlign: 'right', background: 'transparent' }}
                />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '8px 0', borderTop: '1px dashed var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: customValid ? 'var(--success)' : 'var(--ink-3)' }}>
              {customValid ? '✓ Amounts add up' : `Set: PKR ${customTotal.toLocaleString()} / PKR ${tableTotal.toLocaleString()} needed`}
            </span>
          </div>
        </>
      )}

      <div style={{ borderTop: '1px dashed var(--border)', margin: '18px 0 4px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 20px' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>You pay</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
          PKR {youPay.toLocaleString()}
        </span>
      </div>

      <button
        onClick={() => onNext(youPay, myGroup?.items ?? [], allAmounts)}
        disabled={method === 'custom' && !customValid}
        style={{
          width: '100%', height: 52, borderRadius: 100,
          background: (method === 'custom' && !customValid) ? 'var(--border)' : 'var(--accent)',
          color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16,
          border: 'none', cursor: (method === 'custom' && !customValid) ? 'not-allowed' : 'pointer',
          boxShadow: (method === 'custom' && !customValid) ? 'none' : '0 8px 20px -8px rgba(200,118,10,0.5)',
        }}
      >Pay now →</button>
    </div>
  );
}

// ── Pay step ───────────────────────────────────────────────────────────────────

function StepPay({ youPay, coveredAll, guestCount, onPaid }: {
  youPay: number; coveredAll: boolean; guestCount: number;
  onPaid: (method: PayMethod) => Promise<void>;
}) {
  const [selectedPay, setSelectedPay] = useState<PayMethod>('jazz');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try { await onPaid(selectedPay); } finally { setPaying(false); }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 4 }}>
        Pay your share
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: 'var(--ink-2)' }}>Your total</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
          PKR {youPay.toLocaleString()}
        </span>
      </div>
      {coveredAll && guestCount > 0 && (
        <div style={{ background: 'var(--accent-surface)', borderRadius: 12, padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--accent)', border: '1px solid rgba(200,118,10,0.2)' }}>
          You&apos;re picking up the tab for {guestCount} other{guestCount !== 1 ? 's' : ''} — that&apos;s very generous!
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Pay with</div>
      <PayOption label="JazzCash" logo="JAZZ" color="#B2092E" selected={selectedPay === 'jazz'} onClick={() => setSelectedPay('jazz')} />
      <PayOption label="EasyPaisa" logo="EP" color="#00A651" selected={selectedPay === 'easy'} onClick={() => setSelectedPay('easy')} />
      <PayOption label="Credit or Debit Card" logo="CARD" selected={selectedPay === 'card'} onClick={() => setSelectedPay('card')} />
      <div style={{ marginTop: 4, paddingBottom: 8 }}>
        <button
          style={{
            width: '100%', height: 52, borderRadius: 100,
            background: paying ? 'var(--ink-3)' : 'var(--accent)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16,
            border: 'none', cursor: paying ? 'default' : 'pointer', transition: 'background 0.2s ease',
          }}
          onClick={handlePay} disabled={paying || youPay === 0}
        >
          {paying ? 'Processing…' : `Pay PKR ${youPay.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}

// ── Group payment status step ─────────────────────────────────────────────────

function PaidBadge() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M2.5 5.5 4.5 7.5 8.5 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function PendingBadge() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--border)', background: '#fff', flexShrink: 0 }} />
  );
}

function StepStatus({ groups, payments, amounts, sessionId, tableTotal, onDone }: {
  groups: BillGroup[];
  payments: MemberPayment[];
  amounts: Record<string, number>;
  sessionId: string;
  tableTotal: number;
  onDone: () => void;
}) {
  const paymentsMap = useMemo(() => new Map(payments.map(p => [p.sid, p])), [payments]);

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const allPaid = groups.every(g => paymentsMap.has(g.sid) || (amounts[g.sid] ?? 0) === 0);
  const paidCount = groups.filter(g => paymentsMap.has(g.sid) || (amounts[g.sid] ?? 0) === 0).length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          Group payment
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--ink-3)', marginTop: 3 }}>
          {paidCount} of {groups.length} settled
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ margin: '14px 0' }}>
        <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: allPaid ? 'var(--success)' : 'var(--accent)',
            width: `${Math.min(100, tableTotal > 0 ? (totalPaid / tableTotal) * 100 : 0)}%`,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>
            PKR {totalPaid.toLocaleString()} collected
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>
            PKR {tableTotal.toLocaleString()} total
          </span>
        </div>
      </div>

      {/* Per-person rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {groups.map(g => {
          const payment = paymentsMap.get(g.sid);
          const owes = amounts[g.sid] ?? 0;
          const isFree = owes === 0;
          const isMe = g.sid === sessionId;

          return (
            <div key={g.sid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <Av initials={g.initials} size={38} highlight={isMe} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
                  {g.name}{isMe ? ' · you' : ''}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, marginTop: 2, color: payment ? 'var(--success)' : isFree ? 'var(--ink-3)' : 'var(--ink-3)' }}>
                  {payment
                    ? `Paid via ${PAY_METHOD_LABELS[payment.method] ?? payment.method}`
                    : isFree
                      ? 'Covered by the group'
                      : 'Waiting to pay…'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: payment ? 'var(--success)' : isFree ? 'var(--ink-3)' : 'var(--ink)' }}>
                  {isFree ? '—' : `PKR ${owes.toLocaleString()}`}
                </span>
                {payment ? <PaidBadge /> : isFree ? null : <PendingBadge />}
              </div>
            </div>
          );
        })}
      </div>

      {/* All settled banner */}
      {allPaid && (
        <div style={{
          margin: '20px 0 0', background: 'var(--success-surface)', borderRadius: 14,
          padding: '14px 16px', textAlign: 'center',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--success)',
        }}>
          Everyone&apos;s settled up! 🎉
        </div>
      )}

      {/* Pending reminder */}
      {!allPaid && (
        <div style={{
          margin: '20px 0 0', background: 'var(--surface)', borderRadius: 14,
          padding: '12px 14px',
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5,
        }}>
          Waiting for {groups.filter(g => !paymentsMap.has(g.sid) && (amounts[g.sid] ?? 0) > 0).map(g => g.name).join(', ')} to pay. This page updates in real-time.
        </div>
      )}

      <button
        onClick={onDone}
        style={{
          width: '100%', height: 52, borderRadius: 100, marginTop: 20,
          background: 'var(--ink)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15,
          border: 'none', cursor: 'pointer',
        }}
      >Done — New Session</button>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function PaymentScreen() {
  const { goBack, orders, sessionId, tableId, showToast, resetOrder, recordPayment, saveBillSplit, payments, billSplit } = useApp();

  const [step, setStep] = useState<PayStep>('split');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [youPay, setYouPay] = useState(0);
  const [paidItems, setPaidItems] = useState<BillItem[]>([]);
  const [paidMethod, setPaidMethod] = useState<PayMethod>('jazz');
  const [localAmounts, setLocalAmounts] = useState<Record<string, number>>({});

  // Build per-person bill groups from orders timeline
  const groups = useMemo<BillGroup[]>(() => {
    const byPerson = new Map<string, BillGroup>();
    for (const o of orders) {
      for (const li of o.lineItems) {
        const g = byPerson.get(li.bySid) ?? {
          sid: li.bySid, name: li.byName,
          initials: (li.byName || '??').slice(0, 2).toUpperCase(),
          items: [] as BillItem[], isMe: li.bySid === sessionId,
        };
        g.items.push({ name: li.name, price: li.price, quantity: li.quantity, emoji: ITEM_BY_ID[li.id]?.emoji, image: ITEM_BY_ID[li.id]?.image });
        byPerson.set(li.bySid, g);
      }
    }
    return [...byPerson.values()];
  }, [orders, sessionId]);

  const myGroup = groups.find(g => g.isMe) ?? null;
  const others = groups.filter(g => !g.isMe);

  const tableSubtotal = groups.reduce((s, g) => s + g.items.reduce((a, i) => a + i.price * i.quantity, 0), 0);
  const tableTotal = Math.round(tableSubtotal * 1.16);

  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const g of groups) {
      init[g.sid] = Math.round(g.items.reduce((s, i) => s + i.price * i.quantity, 0) * 1.16);
    }
    return init;
  });

  // Redirect back if nothing to pay
  useEffect(() => {
    if (orders.length === 0) goBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Solo (no group): skip split/share, go straight to pay
  useEffect(() => {
    if (groups.length <= 1 && step === 'split') {
      const mySubtotal = myGroup ? myGroup.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;
      setYouPay(Math.round(mySubtotal * 1.16));
      setPaidItems(myGroup?.items ?? []);
      setStep('pay');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);

  const handleBack = () => {
    if (step === 'split') goBack();
    else if (step === 'share') setStep('split');
    else if (step === 'pay') setStep(groups.length > 1 ? 'share' : 'split');
  };

  const handleShareNext = async (amount: number, items: BillItem[], allAmounts: Record<string, number>) => {
    setYouPay(amount);
    setPaidItems(items);
    setLocalAmounts(allAmounts);
    try { await saveBillSplit(splitMethod, allAmounts); } catch { /* don't block */ }
    setStep('pay');
  };

  const handlePaid = async (method: PayMethod): Promise<void> => {
    setPaidMethod(method);
    try {
      await Promise.all(orders.filter(o => !o.paid).map(o => api.payOrder(tableId, o.id, method)));
    } catch { /* demo — don't block success */ }
    if (groups.length > 1) {
      try { await recordPayment(youPay, method); } catch { /* don't block */ }
    }
    showToast('Payment successful!', undefined, true);
    setStep(groups.length > 1 ? 'status' : 'success');
  };

  const handleDone = async () => { await resetOrder(); };
  const handleSendReceipt = () => showToast('Receipt sent to your number!', undefined, true);

  // The amounts to show on the status screen: prefer Firebase billSplit (synced across devices),
  // fall back to locally computed amounts if Firebase hasn't resolved yet.
  const statusAmounts = billSplit?.amounts ?? localAmounts;

  const isTerminal = step === 'status' || step === 'success';

  return (
    <ScreenFrame>
      {!isTerminal && <BackButton onClick={handleBack} />}

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '92%',
        background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.12)',
        animation: 'slideUpSheet 0.35s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <SheetHandle />

        {/* Step progress bar — only for the 3 pre-payment steps */}
        {groups.length > 1 && !isTerminal && (
          <div style={{ display: 'flex', gap: 6, padding: '0 20px 14px' }}>
            {(['split', 'share', 'pay'] as PayStep[]).map((s, i) => (
              <div key={s} style={{
                height: 3, flex: 1, borderRadius: 2,
                background: ['split', 'share', 'pay'].indexOf(step) >= i ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        )}

        {step === 'split' && (
          <StepSplit method={splitMethod} setMethod={setSplitMethod} onNext={() => setStep('share')} tableTotal={tableTotal} peopleCount={groups.length} />
        )}

        {step === 'share' && (
          <StepShare method={splitMethod} groups={groups} myGroup={myGroup} tableTotal={tableTotal} customAmounts={customAmounts} setCustomAmounts={setCustomAmounts} onNext={handleShareNext} />
        )}

        {step === 'pay' && (
          <StepPay youPay={youPay} coveredAll={splitMethod === 'one' && others.length > 0} guestCount={others.length} onPaid={handlePaid} />
        )}

        {step === 'status' && (
          <StepStatus
            groups={groups}
            payments={payments}
            amounts={statusAmounts}
            sessionId={sessionId}
            tableTotal={tableTotal}
            onDone={handleDone}
          />
        )}

        {step === 'success' && (
          <SuccessState amount={youPay} payMethod={paidMethod} items={paidItems} onDone={handleDone} onSendReceipt={handleSendReceipt} />
        )}
      </div>
    </ScreenFrame>
  );
}
