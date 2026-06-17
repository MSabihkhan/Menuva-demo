'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Avatar, Button, Divider, FoodTile, TableChip, BackButton, Input } from '../primitives';
import { WaiterSuggestion } from '../SuggestionCard';
import { recommend } from '@/data/recommendations';

function PersonCard({ avatar, name, items, subtotal }: {
  avatar: string; name: string;
  items: { name: string; price: number; quantity: number; emoji: string; image?: string }[];
  subtotal: number;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, border: '1px solid var(--border)', padding: 16,
      boxShadow: '0 8px 24px -16px rgba(0,0,0,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar initials={avatar} size={36} style={{ border: 'none' }} />
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{name}</div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)' }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FoodTile emoji={it.emoji} image={it.image} alt={it.name} size={42} radius={11} />
            <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)' }}>
              {it.name}{it.quantity > 1 ? <span style={{ color: 'var(--ink-3)' }}> ×{it.quantity}</span> : null}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>
              PKR {(it.price * it.quantity).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <Divider style={{ margin: '14px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)' }}>{name}'s total</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--accent)' }}>
          PKR {subtotal.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export function OrderScreen() {
  const { groupMembers, getCartTotal, setScreen, goBack, showToast, placeOrder, orders } = useApp();
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const subtotal = getCartTotal();
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + tax;

  const allMembers = groupMembers.filter(m => m.items.length > 0);
  const hasActiveOrders = orders.length > 0;

  // Smart waiter pairing, read from the whole table's cart.
  const cartCtx = groupMembers.flatMap(m => m.items).map(i => ({ id: i.id, category: i.category, spicy: i.spicy }));
  const suggestion = recommend(cartCtx);

  const handlePlaceOrder = async () => {
    if (allMembers.length === 0) {
      showToast('Add some items first!');
      return;
    }
    setPlacing(true);
    try {
      await placeOrder(kitchenNotes);
      showToast('Order placed! Kitchen is notified.', undefined, true);
      // Back to the menu — the tracker pill now shows status. No forced waiting screen.
      setScreen('menu');
    } catch {
      showToast('Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <ScreenFrame>
      <BackButton onClick={goBack} />

      {/* Scrollable content */}
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0, bottom: 80,
        overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        padding: '16px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 42 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Ready to order?
          </div>
          <TableChip />
        </div>

        {/* Per-person cards */}
        {allMembers.length === 0 ? (
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24,
            textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)',
          }}>
            Your cart is empty. Add items from the menu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {allMembers.map(member => (
              <PersonCard
                key={member.id}
                avatar={member.initials}
                name={member.name}
                items={member.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, emoji: i.emoji, image: i.image }))}
                subtotal={member.items.reduce((sum, i) => sum + i.price * i.quantity, 0)}
              />
            ))}
          </div>
        )}

        {/* Kitchen notes */}
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, color: 'var(--ink-2)', marginBottom: 8 }}>
            Notes for the kitchen
          </div>
          <Input
            placeholder="Any allergies or preferences? (optional)"
            value={kitchenNotes}
            onChange={setKitchenNotes}
          />
        </div>

        {/* Smart waiter recommendation */}
        {suggestion && <WaiterSuggestion suggestion={suggestion} />}

        {/* Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)' }}>
            <span>Subtotal</span><span>PKR {subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)' }}>
            <span>Tax (16%)</span><span>PKR {tax.toLocaleString()}</span>
          </div>
          <Divider style={{ margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 18, color: 'var(--ink)' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 18, color: 'var(--accent)' }}>
              PKR {total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div style={{
        position: 'absolute', bottom: 34, left: 0, right: 0,
        padding: '10px 20px 12px',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 35%)',
      }}>
        {allMembers.length === 0 ? (
          hasActiveOrders ? (
            <Button onClick={() => setScreen('waiting')}>
              Track Order →
            </Button>
          ) : (
            <Button onClick={handlePlaceOrder} disabled>
              Place Order
            </Button>
          )
        ) : (
          <Button onClick={handlePlaceOrder} disabled={placing}>
            {placing ? 'Placing…' : 'Place Order'}
          </Button>
        )}
      </div>
    </ScreenFrame>
  );
}
