'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Button } from '../primitives';

// Side-effect import: registers <model-viewer> custom element
// Loaded only when needed (this screen is lazy-loaded)
let modelViewerLoaded = false;
function loadModelViewer() {
  if (modelViewerLoaded || typeof window === 'undefined') return;
  modelViewerLoaded = true;
  import('@google/model-viewer');
}

export function Viewer3DScreen() {
  const { selectedItem, setScreen, addToCart, goBack } = useApp();
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef({ x: -8, y: 0, vx: 0, vy: 0.4 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const rafRef = useRef(0);

  const hasRealModel = !!selectedItem?.modelUrl;

  // Load model-viewer library and simulate/await model load
  useEffect(() => {
    if (hasRealModel) {
      loadModelViewer();
      // model-viewer handles its own loading; just show after a short delay
      const t = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [hasRealModel]);

  // Auto-rotation + inertia animation loop
  useEffect(() => {
    if (loading || !emojiRef.current) return;

    const tick = () => {
      if (!dragRef.current.active) {
        // Auto rotate Y only — X is purely user-controlled so drag isn't overwritten
        rotRef.current.y += rotRef.current.vy;
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
    setIsDragging(true);
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
    setIsDragging(false);
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
      {/* Premium studio backdrop — warm amber spotlight + soft vignette,
          replaces the flat black so the dish feels staged, not floating in void. */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background:
          'radial-gradient(58% 40% at 50% 42%, rgba(200,118,10,0.20) 0%, transparent 66%),' +
          'radial-gradient(135% 100% at 50% 30%, #2d2723 0%, #1a1612 46%, #0b0a09 100%)',
      }}/>

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
          cursor: loading ? 'default' : isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={loading || hasRealModel ? undefined : onPointerDown}
        onPointerMove={loading || hasRealModel ? undefined : onPointerMove}
        onPointerUp={loading || hasRealModel ? undefined : onPointerUp}
        onPointerCancel={loading || hasRealModel ? undefined : onPointerUp}
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
        ) : hasRealModel ? (
          // Real GLB model via <model-viewer>, AR-enabled. model-viewer shows its
          // built-in "View in your space" button automatically on AR-capable phones.
          // disable-pan + bounded orbit keep the dish centered & sized consistently
          // (no drifting on drag); ar-scale="fixed" stops the AR model resizing on
          // the table; environment-image="neutral" gives soft studio reflections.
          // @ts-expect-error — declared in src/types/model-viewer.d.ts
          <model-viewer
            src={selectedItem.modelUrl}
            alt={selectedItem.name}
            auto-rotate
            auto-rotate-delay="800"
            rotation-per-second="20deg"
            camera-controls
            disable-pan
            interaction-prompt="none"
            touch-action="pan-y"
            environment-image="neutral"
            shadow-intensity="1.5"
            shadow-softness="0.9"
            exposure="1.05"
            camera-orbit="0deg 72deg 105%"
            min-camera-orbit="auto 35deg 85%"
            max-camera-orbit="auto 92deg 150%"
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            ar-placement="floor"
            style={{
              width: '100%', height: '100%',
              background: 'transparent',
              '--progress-bar-color': 'var(--accent)',
            } as React.CSSProperties}
          />
        ) : (
          // Emoji viewer for items without a GLB model
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

      {/* Drag hint — only for the emoji viewer */}
      {!loading && !hasRealModel && (
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
