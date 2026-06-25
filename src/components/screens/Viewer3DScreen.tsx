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
  const [tableMode, setTableMode] = useState(false);
  const [cameraLive, setCameraLive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

  // ── Pseudo-AR "view on your table" ──────────────────────────────────────────
  // We deliberately avoid world-tracked AR (Scene Viewer / WebXR / Quick Look):
  // that is what makes the dish drift and rescale. Instead we render a live
  // rear-camera feed behind a screen-anchored, transparent <model-viewer> whose
  // zoom and pan are locked — so the dish can be rotated but can never drift or
  // change size. Starts the camera on entry; always releases tracks on exit.
  useEffect(() => {
    if (!tableMode) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }, audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraLive(true);
      } catch {
        // No camera, permission denied, or insecure context → drop back to studio.
        if (!cancelled) setTableMode(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraLive(false);
    };
  }, [tableMode]);

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

      {/* Live rear-camera feed for "view on your table" — sits behind the
          transparent model-viewer. Covered by the studio backdrop until live. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          width: '100%', height: '100%', objectFit: 'cover',
          opacity: cameraLive ? 1 : 0, transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
      />

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
          position: 'absolute', left: 0, right: 0, zIndex: 2,
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
          // Screen-anchored GLB viewer. disable-zoom + disable-pan are the core of
          // the steady "view on your table" behaviour: the dish can only rotate, so
          // it can never drift off-centre or change size. Transparent background lets
          // the live camera feed (in table mode) or the studio backdrop show through.
          // Shadow is dropped in table mode — a contact shadow with no real surface
          // under it reads as fake.
          // @ts-expect-error — declared in src/types/model-viewer.d.ts
          <model-viewer
            src={selectedItem.modelUrl}
            alt={selectedItem.name}
            camera-controls
            disable-zoom
            disable-pan
            auto-rotate
            auto-rotate-delay="3000"
            rotation-per-second="16deg"
            interaction-prompt="none"
            environment-image="neutral"
            exposure="1.05"
            shadow-intensity={tableMode ? '0' : '1.2'}
            shadow-softness="0.9"
            camera-orbit="0deg 78deg 105%"
            min-camera-orbit="auto 25deg auto"
            max-camera-orbit="auto 100deg auto"
            style={{
              width: '100%', height: '100%',
              background: 'transparent',
              touchAction: 'none',
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

      {/* View-on-your-table toggle + hint (real models only) */}
      {!loading && hasRealModel && (
        <>
          <button
            onClick={() => setTableMode((v) => !v)}
            style={{
              position: 'absolute', left: '50%', bottom: 164, transform: 'translateX(-50%)',
              zIndex: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 100,
              background: tableMode ? 'rgba(0,0,0,0.55)' : 'var(--accent)',
              color: tableMode ? '#fff' : '#1a120a',
              border: tableMode ? '1px solid rgba(255,255,255,0.18)' : 'none',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }}
          >
            {tableMode ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
            {tableMode ? 'Exit table view' : 'View on your table'}
          </button>

          {tableMode && cameraLive && (
            <div style={{
              position: 'absolute', left: '50%', top: 112, transform: 'translateX(-50%)',
              zIndex: 10, pointerEvents: 'none',
              padding: '6px 14px', borderRadius: 100,
              background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
            }}>Drag to rotate · point at your table</div>
          )}
        </>
      )}

      {/* Bottom panel */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10,
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
