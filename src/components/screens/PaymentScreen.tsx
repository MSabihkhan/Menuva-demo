'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Button, Input, Divider } from '../primitives';

function SheetHandle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }}/>
    </div>
  );
}

function PayLogo({ name, color }: { name: string; color?: string }) {
  return (
    <div style={{
      width: 40, height: 28, borderRadius: 6,
      background: 'var(--surface)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 10, color: color || 'var(--ink-2)',
      letterSpacing: '0.02em', flexShrink: 0,
    }}>{name}</div>
  );
}

function PayOption({ label, logo, color, selected, expanded, onClick }: { label: string; logo: string; color?: string; selected?: boolean; expanded?: boolean; onClick?: () => void }) {
  return (
    <div>
      <div 
        style={{
          height: 56, borderRadius: 12,
          background: '#fff',
          border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
          padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer',
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
          {selected && <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--accent)' }}/>}
        </div>
      </div>
      {expanded && selected && (
        <div style={{ paddingTop: 12, paddingLeft: 4, paddingRight: 4 }}>
          <Input label="JazzCash number" placeholder="+92 300 0000000" />
        </div>
      )}
    </div>
  );
}

export function PaymentScreen() {
  const { setScreen, groupMembers, showToast, setShowPayment, goBack } = useApp();
  const [selectedPay, setSelectedPay] = useState('jazz');
  const currentUser = groupMembers.find(m => m.isCurrentUser);
  const userTotal = currentUser?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;
  const share = Math.ceil(userTotal * 1.16);

  const handlePay = () => {
    showToast('Payment successful!', undefined, true);
    setShowPayment(false);
    goBack();
  };

  const handleClose = () => {
    setShowPayment(false);
  };

  if (!currentUser) return null;

  return (
    <ScreenFrame>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,25,24,0.35)', cursor: 'pointer' }} onClick={handleClose}/>
     

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: '72%',
        background: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.12)',
      }}>
        <div style={{
          height: 28,
          background: 'rgba(255,255,255,0.6)',
        }}>
          <SheetHandle />
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(232,230,225,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Pay your share
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 20, color: 'var(--accent)' }}>
            PKR {share.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: 20, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Pay with</div>

          <PayOption label="JazzCash" logo="JAZZ" color="#B2092E" selected={selectedPay === 'jazz'} expanded onClick={() => setSelectedPay('jazz')} />
          <PayOption label="EasyPaisa" logo="EP" color="#00A651" selected={selectedPay === 'easy'} onClick={() => setSelectedPay('easy')} />
          <PayOption label="Credit or Debit Card" logo="CARD" selected={selectedPay === 'card'} onClick={() => setSelectedPay('card')} />

          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentUser.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)' }}>
                <span>{item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name}</span>
                <span>PKR {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <Divider style={{ margin: '2px 0' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>Your share</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--accent)' }}>PKR {share.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <Button onClick={handlePay}>Pay PKR {share.toLocaleString()}</Button>
          </div>
        </div>
      </div>

     
    </ScreenFrame>
  );
}