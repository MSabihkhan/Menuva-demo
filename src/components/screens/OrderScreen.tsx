'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Avatar, Button, Divider, SmallOutlineButton, FoodTile, TableChip, Chip, Input } from '../primitives';
import { MENU_ITEMS } from '@/data/menu';

function PersonCard({ avatar, name, items, subtotal, isCurrentUser }: { avatar: string; name: string; items: { name: string; price: number; quantity: number }[]; subtotal: number; isCurrentUser?: boolean }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid var(--border)',
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar initials={avatar} size={36} style={{ border: 'none' }}/>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: 'var(--ink)' }}>{name}</div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)' }}>
          {items.length} items
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)' }}>
            <span>{it.quantity > 1 ? `${it.name} ×${it.quantity}` : it.name}</span>
            <span>PKR {(it.price * it.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <Divider style={{ margin: '12px 0' }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)' }}>{name}'s total</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: 'var(--accent)' }}>PKR {subtotal.toLocaleString()}</div>
      </div>
    </div>
  );
}

export function OrderScreen() {
  const { groupMembers, getCartTotal, setScreen, showToast, setOrderStatus, addToCart } = useApp();
  const [ grillAdded, setGrillAdded ] = useState(false);
  const [ kitchenNotes, setKitchenNotes ] = useState('');
  
  const subtotal = getCartTotal();
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + tax;

  const handlePlaceOrder = () => {
    setOrderStatus('placed');
    showToast('Order placed successfully!', undefined, true);
    setScreen('waiting');
  };

  return (
    <ScreenFrame>
     
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0, bottom: 34,
        padding: '16px 20px 96px',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Ready to order?
          </div>
          <TableChip />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupMembers.filter(m => m.items.length > 0).map(member => (
            <PersonCard
              key={member.id}
              avatar={member.initials}
              name={member.name}
              items={member.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity }))}
              subtotal={member.items.reduce((sum, i) => sum + i.price * i.quantity, 0)}
              isCurrentUser={member.isCurrentUser}
            />
          ))}
        </div>

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

        <div style={{
          background: 'var(--accent-surface)', borderRadius: 16,
          border: '1px solid rgba(200,118,10,0.2)', padding: 14,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <FoodTile emoji="🍖" size={48} bg="#FDEACC" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-2)' }}>
              Since you're all together—
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>
              Mixed Grill Platter
            </div>
          </div>
          <SmallOutlineButton onClick={() => {
            if (!grillAdded) {
              setGrillAdded(true);
              addToCart(MENU_ITEMS.find(i => i.name === 'Seekh Kebab Platter')!, 1, []);
              showToast('Mixed Grill added to order!');
            }
          }}>
            {grillAdded ? 'Added!' : 'Add PKR 2,200'}
          </SmallOutlineButton>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)' }}>
            <span>Subtotal</span><span>PKR {subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)' }}>
            <span>Tax (16%)</span><span>PKR {tax.toLocaleString()}</span>
          </div>
          <Divider style={{ margin: '4px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 18, color: 'var(--ink)' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 18, color: 'var(--accent)' }}>PKR {total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 34, left: 0, right: 0,
        padding: '12px 20px 12px',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 40%)',
      }}>
        <Button onClick={handlePlaceOrder}>Place Order</Button>
      </div>

     
    </ScreenFrame>
  );
}