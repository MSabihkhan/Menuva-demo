'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Button } from '../primitives';

export function Viewer3DScreen() {
  const { selectedItem, setScreen, addToCart, goBack } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddToOrder = () => {
    if (selectedItem) {
      addToCart(selectedItem, 1, []);
      setScreen('menu');
    }
  };

  if (!selectedItem) return null;

  return (
    <ScreenFrame dark>
      <div style={{
        position: 'absolute', top: 56, left: 20, zIndex: 3,
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 18, fontWeight: 300, lineHeight: 1,
        cursor: 'pointer',
      }}
      onClick={goBack}
      >×</div>

      {loading ? (
        <>
          <div style={{
            position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%)',
            width: 260, height: 260,
          }}>
            {[260, 230, 200].map((d, i) => (
              <div key={d} style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                width: d, height: d, borderRadius: '50%',
                background: `rgba(255,255,255,${0.02 + i * 0.02})`,
                border: `1px solid rgba(255,255,255,${0.06 + i * 0.04})`,
              }}/>
            ))}
            <div style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
              width: 32, height: 32, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.15)',
              borderTopColor: 'rgba(255,255,255,0.55)',
              animation: 'spin 1s linear infinite',
            }}/>
          </div>

          <div style={{
            position: 'absolute', left: 0, right: 0, top: 'calc(42% + 150px)',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(255,255,255,0.6)',
          }}>Loading 3D model</div>
        </>
      ) : (
        <>
          <div style={{
            position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%, -50%)',
            width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,118,10,0.18) 0%, rgba(200,118,10,0) 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #ffffff 0%, #F7F6F3 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 120, lineHeight: 1,
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            }}>{selectedItem.emoji}</div>
          </div>

          <div style={{
            position: 'absolute', left: 0, right: 0, top: 'calc(40% + 138px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-sans)', fontSize: 13,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11.5 5.5A5 5 0 0 0 3 4.2M2.5 8.5A5 5 0 0 0 11 9.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              <path d="M11.5 3v2.5H9M2.5 11V8.5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            Drag to rotate
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: 'scaleX(-1)' }}>
              <path d="M11.5 5.5A5 5 0 0 0 3 4.2M2.5 8.5A5 5 0 0 0 11 9.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              <path d="M11.5 3v2.5H9M2.5 11V8.5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
        </>
      )}

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTop: '1px solid rgba(255,255,255,0.18)',
        padding: '16px 16px 42px',
        height: loading ? 114 : 134,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 16, color: '#fff' }}>{selectedItem.name}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 16, color: 'var(--accent-light)' }}>PKR {selectedItem.price.toLocaleString()}</div>
        </div>
        <div style={{ marginTop: loading ? 12 : 16 }}>
          <Button onClick={handleAddToOrder}>
            {loading ? 'Add to Order' : `Add to Order — PKR ${selectedItem.price.toLocaleString()}`}
          </Button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }`}</style>
    </ScreenFrame>
  );
}