'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Chip, Button, BackButton } from '../primitives';
import { EXTRAS, MENU_ITEMS, MenuItem } from '@/data/menu';

// ── Upsell config ────────────────────────────────────────────────────────────

const UPSELL_MAP: Record<string, { ids: string[]; headline: string; sub: string }> = {
  Mains:    { ids: ['6', '10', '9'],  headline: 'Complete the meal',  sub: 'Guests who ordered this also added…' },
  Grills:   { ids: ['10', '9', '6'],  headline: 'Grill essentials',   sub: 'The classic pairings for a grill plate…' },
  Starters: { ids: ['1', '3', '8'],   headline: 'Make it a full meal', sub: 'Follow your starter with…' },
  Desserts: { ids: ['6'],             headline: 'End on a high note',  sub: 'The perfect finish…' },
  Drinks:   { ids: ['7', '2', '9'],   headline: 'Add a bite',          sub: 'Something to eat alongside…' },
};

function getUpsells(item: MenuItem): MenuItem[] {
  const config = UPSELL_MAP[item.category] ?? UPSELL_MAP['Drinks'];
  return MENU_ITEMS.filter(i => config.ids.includes(i.id) && i.id !== item.id).slice(0, 2);
}

// ── UpsellPopup ───────────────────────────────────────────────────────────────

function UpsellPopup({ addedItem, onDismiss }: { addedItem: MenuItem; onDismiss: () => void }) {
  const { addToCart, showToast } = useApp();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const config = UPSELL_MAP[addedItem.category] ?? UPSELL_MAP['Drinks'];
  const suggestions = getUpsells(addedItem);

  // No suggestions → skip popup
  useEffect(() => {
    if (suggestions.length === 0) onDismiss();
  }, [suggestions.length, onDismiss]);

  if (suggestions.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: 'rgba(26,25,24,0.55)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          background: '#fff',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '0 20px 32px',
          animation: 'slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.01em',
            }}>
              {config.headline}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)', paddingLeft: 26 }}>
            {config.sub}
          </div>
        </div>

        {/* Suggestion cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {suggestions.map(item => {
            const isAdded = added.has(item.id);
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: isAdded ? 'var(--success-surface)' : 'var(--surface)',
                borderRadius: 14, padding: '12px 14px',
                border: `1px solid ${isAdded ? 'rgba(45,106,79,0.2)' : 'var(--border)'}`,
                transition: 'background 0.2s ease, border-color 0.2s ease',
              }}>
                <div style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>{item.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: 'var(--ink)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{item.name}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
                    PKR {item.price.toLocaleString()}
                  </div>
                </div>
                <button
                  style={{
                    padding: '8px 16px', borderRadius: 100,
                    background: isAdded ? 'var(--success)' : 'var(--accent)',
                    color: '#fff',
                    fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13,
                    border: 'none', cursor: isAdded ? 'default' : 'pointer',
                    flexShrink: 0,
                    transition: 'background 0.15s ease',
                    minWidth: 70, textAlign: 'center',
                  }}
                  onClick={() => {
                    if (!isAdded) {
                      addToCart(item, 1, []);
                      setAdded(prev => new Set([...prev, item.id]));
                      showToast(`${item.name} added!`, undefined, true);
                    }
                  }}
                >
                  {isAdded ? '✓ Added' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Continue */}
        <button
          style={{
            width: '100%', height: 52, borderRadius: 100,
            background: 'var(--ink)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15,
            border: 'none', cursor: 'pointer',
          }}
          onClick={onDismiss}
        >
          Continue to menu →
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SheetHandle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
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
          background: 'transparent',
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
          background: 'transparent',
        }}
        onClick={onPlus}
      >+</button>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function DetailScreen() {
  const {
    selectedItem, goBack, setScreen,
    itemQuantity, setItemQuantity,
    itemExtras, addItemExtra, removeItemExtra,
    addToCart,
  } = useApp();

  const [showUpsell, setShowUpsell] = useState(false);

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
    setShowUpsell(true);
  };

  return (
    <ScreenFrame>
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
        <div style={{ background: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(232,230,225,0.4)' }}>
          <SheetHandle />
        </div>

        {/* Emoji hero → 3D viewer */}
        <div
          style={{
            height: 200, width: '100%', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 105, flexShrink: 0, cursor: 'pointer', position: 'relative',
            userSelect: 'none',
          }}
          onClick={() => setScreen('viewer3d')}
        >
          {selectedItem.emoji}
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--accent)', color: '#fff', borderRadius: 100,
            padding: '5px 14px', fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1 12 4v6l-5 3-5-3V4l5-3Z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
              <path d="M2 4l5 3 5-3M7 7v6" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            View in 3D
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 16px 0',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
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

          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            {selectedItem.desc}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedItem.spicy && <Chip>🌶 Spicy</Chip>}
            {selectedItem.gluten && <Chip>Contains Gluten</Chip>}
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
            }}>Extras</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXTRAS.map(extra => {
                const label = `${extra.name}${extra.price > 0 ? ` +PKR ${extra.price}` : ' · Free'}`;
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

      {/* Upsell popup */}
      {showUpsell && (
        <UpsellPopup
          addedItem={selectedItem}
          onDismiss={() => {
            setShowUpsell(false);
            setScreen('menu');
          }}
        />
      )}
    </ScreenFrame>
  );
}
