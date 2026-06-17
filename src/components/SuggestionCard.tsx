'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { FoodTile } from './primitives';
import { Suggestion } from '@/data/recommendations';

function SparkIcon({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M7 1l1 3.6 3.6 1-3.6 1L7 11l-1-4.4-3.6-1 3.6-1L7 1Z" fill={color} />
    </svg>
  );
}

/**
 * The on-brand "smart waiter" recommendation card. Reads as an intelligent,
 * contextual nudge — a sparkle, a punchy hook, a conversational pitch, and a
 * one-tap add. Reused on the order review and the waiting screen.
 */
export function WaiterSuggestion({ suggestion, onAdd }: { suggestion: Suggestion; onAdd?: () => void }) {
  const { addToCart, groupMembers } = useApp();
  const me = groupMembers.find(m => m.isCurrentUser);
  const added = !!me?.items.some(i => i.id === suggestion.item.id);
  const { item, headline, reason, badge } = suggestion;

  const handleAdd = () => {
    if (added) return;
    addToCart(item, 1, []);
    onAdd?.();
  };

  return (
    <div style={{
      background: 'var(--accent-surface)', border: '1px solid rgba(200,118,10,0.22)',
      borderRadius: 18, padding: 14, boxShadow: '0 10px 26px -18px rgba(200,118,10,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <SparkIcon />
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 11.5, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {headline}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <FoodTile emoji={item.emoji} image={item.image} alt={item.name} size={62} radius={14} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{item.name}</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, color: 'var(--accent)', background: '#fff', borderRadius: 6, padding: '2px 7px', border: '1px solid rgba(200,118,10,0.25)' }}>{badge}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.42, marginTop: 4 }}>
            “{reason}”
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
          PKR {item.price.toLocaleString()}
        </span>
        <button
          onClick={handleAdd}
          disabled={added}
          style={{
            marginLeft: 'auto', height: 38, borderRadius: 11, padding: '0 18px',
            background: added ? 'var(--success)' : 'var(--accent)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
            border: 'none', cursor: added ? 'default' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: added ? 'none' : '0 6px 16px -8px rgba(200,118,10,0.7)',
          }}
        >
          {added ? 'Added' : 'Add to order'}
        </button>
      </div>
    </div>
  );
}
