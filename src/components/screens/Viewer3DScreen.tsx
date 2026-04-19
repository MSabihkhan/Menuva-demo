'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Button } from '../primitives';

export function Viewer3DScreen() {
  const { selectedItem, setScreen, addToCart, goBack } = useApp();
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef({ x: -8, y: 0, vx: 0, vy: 0.4 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const rafRef = useRef(0);

  // Simulate model load
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // Auto-rotation + inertia animation loop
  useEffect(() => {
    if (loading || !emojiRef.current) return;

    const tick = () => {
      if (!dragRef.current.active) {
        // Auto rotate
        rotRef.current.y += rotRef.current.vy;
        // Gentle bob
        rotRef.current.x = -8 + Math.sin(Date.now() / 2000) * 5;
      } else {
        // Apply inertia
        rotRef.current.vy *= 0.92;
        rotRef.current.vx *= 0.92;
      }

      if (emojiRef.current) {
        emojiRef.current.style.transform =
          `perspective(500px) rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loading]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current.active = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    rotRef.current.y += dx * 0.6;
    rotRef.current.x += dy * 0.3;
    rotRef.current.vy = dx * 0.6;
    rotRef.current.vx = dy * 0.3;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
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
      {/* Close button */}
      <div
        style={{
          position: 'absolute', top: 56, left: 20, zIndex: 10,
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff', fontSize: 20, fontWeight: 300,
        }}
        onClick={goBack}
      >×</div>

      {/* 3D viewport */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: 100, bottom: loading ? 120 : 148,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: loading ? 'default' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={loading ? undefined : onPointerDown}
        onPointerMove={loading ? undefined : onPointerMove}
        onPointerUp={loading ? undefined : onPointerUp}
        onPointerCancel={loading ? undefined : onPointerUp}
      >
        {loading ? (
          // Loading rings
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            {[200, 160, 120].map((d, i) => (
              <div key={d} style={{
                position: 'absolute', left: '50%', top: '50%',
                width: d, height: d, borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                background: `rgba(255,255,255,${0.02 + i * 0.018})`,
                border: `1px solid rgba(255,255,255,${0.06 + i * 0.04})`,
              }}/>
            ))}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 32, height: 32, borderRadius: '50%',
              border: '2.5px solid rgba(255,255,255,0.15)',
              borderTopColor: 'rgba(255,255,255,0.65)',
              transform: 'translate(-50%, -50%)',
              animation: 'spin 0.9s linear infinite',
            }}/>
            <div style={{
              position: 'absolute', left: '50%', top: 'calc(50% + 70px)',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap',
            }}>Loading 3D model…</div>
          </div>
        ) : (
          // 3D emoji
          <div style={{
            position: 'relative',
            width: 240, height: 240,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Ambient glow */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,118,10,0.22) 0%, transparent 70%)',
            }}/>

            {/* The emoji */}
            <div
              ref={emojiRef}
              style={{
                width: 200, height: 200, borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 32%, #fff 0%, #F0EEE9 60%, #E2DED6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 110, lineHeight: 1,
                boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
                willChange: 'transform',
                userSelect: 'none',
              }}
            >
              {selectedItem.emoji}
            </div>
          </div>
        )}
      </div>

      {/* Drag hint */}
      {!loading && (
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: '62%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'var(--font-sans)', fontSize: 13,
          pointerEvents: 'none',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11.5 5.5A5 5 0 0 0 3 4.2M2.5 8.5A5 5 0 0 0 11 9.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            <path d="M11.5 3v2.5H9M2.5 11V8.5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          Drag to rotate
        </div>
      )}

      {/* Bottom panel */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTop: '1px solid rgba(255,255,255,0.14)',
        padding: '16px 20px 42px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 16, color: '#fff' }}>
            {selectedItem.name}
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--accent-light)' }}>
            PKR {selectedItem.price.toLocaleString()}
          </div>
        </div>
        <Button onClick={handleAddToOrder}>
          {loading ? 'Add to Order' : `Add to Order — PKR ${selectedItem.price.toLocaleString()}`}
        </Button>
      </div>

      <style>{`
        @keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
      `}</style>
    </ScreenFrame>
  );
}
