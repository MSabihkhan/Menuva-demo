'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Chip, Button, Divider, BackButton } from '../primitives';
import { EXTRAS } from '@/data/menu';

function SheetHandle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }}/>
    </div>
  );
}

function ExtraChip({ children, selected, onClick }: { children: string; selected?: boolean; onClick?: () => void }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '8px 14px', borderRadius: 100,
        background: selected ? 'var(--accent)' : 'var(--surface)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        color: selected ? '#fff' : 'var(--ink)',
        fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13,
        whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

function QtyStepper({ quantity, onMinus, onPlus }: { quantity: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <button
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink)', fontSize: 18, lineHeight: 1, cursor: 'pointer',
          background: 'transparent', transition: 'background 0.12s ease',
        }}
        onClick={onMinus}
      >−</button>
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 18, minWidth: 16, textAlign: 'center' }}>
        {quantity}
      </div>
      <button
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink)', fontSize: 18, lineHeight: 1, cursor: 'pointer',
          background: 'transparent', transition: 'background 0.12s ease',
        }}
        onClick={onPlus}
      >+</button>
    </div>
  );
}

export function DetailScreen() {
  const {
    selectedItem, goBack, setScreen,
    itemQuantity, setItemQuantity,
    itemExtras, addItemExtra, removeItemExtra,
    addToCart,
  } = useApp();

  // Navigate back if no item selected (e.g. after reset)
  useEffect(() => {
    if (!selectedItem) goBack();
  }, [selectedItem, goBack]);

  if (!selectedItem) return null;

  const extrasTotal = itemExtras.reduce((sum, eid) => {
    const extra = EXTRAS.find(e => e.id === eid);
    return sum + (extra?.price || 0);
  }, 0);

  const total = (selectedItem.price + extrasTotal) * itemQuantity;

  const handleAddToOrder = () => {
    addToCart(selectedItem, itemQuantity, itemExtras);
    setScreen('menu');
  };

  return (
    <ScreenFrame>
      {/* Back button over the emoji hero area */}
      <BackButton onClick={goBack} />

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: 80,
        background: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.09)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Sheet handle */}
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          borderBottom: '1px solid rgba(232,230,225,0.4)',
        }}>
          <SheetHandle />
        </div>

        {/* Emoji hero — tappable to open 3D viewer */}
        <div
          style={{
            height: 200, width: '100%', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 105, flexShrink: 0, cursor: 'pointer', position: 'relative',
            userSelect: 'none',
          }}
          onClick={() => setScreen('viewer3d')}
          title="Tap to view in 3D"
        >
          {selectedItem.emoji}
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--accent)', color: '#fff', borderRadius: 100,
            padding: '5px 14px', fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap',
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1 12 4v6l-5 3-5-3V4l5-3Z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
              <path d="M2 4l5 3 5-3M7 7v6" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
            View in 3D
          </div>
        </div>

        {/* Scrollable detail content */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 16px 0',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Title + price */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)',
              letterSpacing: '-0.01em', lineHeight: 1.15, flex: 1,
            }}>
              {selectedItem.name}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 18, color: 'var(--accent)', flexShrink: 0 }}>
              PKR {selectedItem.price.toLocaleString()}
            </div>
          </div>

          {/* Description */}
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            {selectedItem.desc}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedItem.spicy && <Chip>🌶 Spicy</Chip>}
            {selectedItem.gluten && <Chip>Contains Gluten</Chip>}
          </div>

          {/* Extras */}
          <div>
            <div style={{
              fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
            }}>Extras</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXTRAS.map(extra => {
                const label = `${extra.name}${extra.price > 0 ? ` +PKR ${extra.price}` : extra.price < 0 ? ` -PKR ${Math.abs(extra.price)}` : ' · Free'}`;
                return (
                  <ExtraChip
                    key={extra.id}
                    selected={itemExtras.includes(extra.id)}
                    onClick={() => itemExtras.includes(extra.id) ? removeItemExtra(extra.id) : addItemExtra(extra.id)}
                  >
                    {label}
                  </ExtraChip>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: 'var(--ink)' }}>Quantity</div>
            <QtyStepper
              quantity={itemQuantity}
              onMinus={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
              onPlus={() => setItemQuantity(itemQuantity + 1)}
            />
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '12px 16px 20px', borderTop: '1px solid var(--border)' }}>
          <Button onClick={handleAddToOrder}>
            Add to Order — PKR {total.toLocaleString()}
          </Button>
        </div>
      </div>
    </ScreenFrame>
  );
}
