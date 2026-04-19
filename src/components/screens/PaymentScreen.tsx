'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Button, Input, Divider, BackButton } from '../primitives';

function SheetHandle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }}/>
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

function PayOption({ label, logo, color, selected, showInput, onClick }: {
  label: string; logo: string; color?: string;
  selected?: boolean; showInput?: boolean; onClick?: () => void;
}) {
  return (
    <div>
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
          transition: 'border-color 0.15s ease',
        }}>
          {selected && <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--accent)' }}/>}
        </div>
      </div>
      {showInput && selected && (
        <div style={{ paddingTop: 10, paddingLeft: 4, paddingRight: 4 }}>
          <Input label="Account number" placeholder="+92 300 0000000" />
        </div>
      )}
    </div>
  );
}

function SuccessState({ share, onDone }: { share: number; onDone: () => void }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--success-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'successPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M7 17 13 23 25 11" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          Payment received!
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>
          PKR {share.toLocaleString()} paid successfully.{'\n'}Thanks for dining with us!
        </div>
      </div>
      <div style={{ width: '100%', marginTop: 8 }}>
        <Button onClick={onDone}>Done — New Session</Button>
      </div>
    </div>
  );
}

export function PaymentScreen() {
  const { goBack, groupMembers, showToast, resetOrder } = useApp();
  const [selectedPay, setSelectedPay] = useState<'jazz' | 'easy' | 'card'>('jazz');
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);

  const currentUser = groupMembers.find(m => m.isCurrentUser);
  const userTotal = currentUser?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;
  const share = Math.ceil(userTotal * 1.16);

  const handlePay = async () => {
    setPaying(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 1200));
    setPaying(false);
    setPaid(true);
    showToast('Payment successful!', undefined, true);
  };

  const handleDone = async () => {
    await resetOrder();
  };

  if (!currentUser) return null;

  return (
    <ScreenFrame>
      <BackButton onClick={goBack} />

      {/* Sheet container */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: '88%',
        background: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.12)',
        animation: 'slideUpSheet 0.35s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <SheetHandle />

        {/* Header */}
        <div style={{
          padding: '8px 20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Pay your share
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 22, color: 'var(--accent)' }}>
            PKR {share.toLocaleString()}
          </div>
        </div>

        {paid ? (
          <SuccessState share={share} onDone={handleDone} />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Pay with label */}
            <div style={{
              fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Pay with</div>

            <PayOption label="JazzCash" logo="JAZZ" color="#B2092E" selected={selectedPay === 'jazz'} showInput onClick={() => setSelectedPay('jazz')} />
            <PayOption label="EasyPaisa" logo="EP" color="#00A651" selected={selectedPay === 'easy'} showInput onClick={() => setSelectedPay('easy')} />
            <PayOption label="Credit or Debit Card" logo="CARD" selected={selectedPay === 'card'} onClick={() => setSelectedPay('card')} />

            {/* Order breakdown */}
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentUser.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)' }}>
                  <span>{item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name}</span>
                  <span>PKR {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <Divider style={{ margin: '2px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>Your share (incl. 16% tax)</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>PKR {share.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 8 }}>
              <Button onClick={handlePay} disabled={paying}>
                {paying ? 'Processing…' : `Pay PKR ${share.toLocaleString()}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
