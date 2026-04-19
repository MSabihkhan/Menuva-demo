'use client';

import React, { useState, useCallback, useRef, memo, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Chip, AvatarStack, Button, Divider, FoodTile, Toast } from '../primitives';
import { CATEGORIES, MENU_ITEMS, MenuItem, CartItem } from '@/data/menu';
import { useHaptic, MenuItemSkeleton } from '../Feedback';

// Memoized components for performance - avoids unnecessary re-renders
const MemoFoodTile = memo(FoodTile);
const MemoChip = memo(Chip);

// CSS-optimized animation classes instead of Framer Motion
// This uses transform only to avoid layout thrashing

// Optimized MenuHeader - uses CSS transform only, avoids paint
// Using opacity instead of backdropFilter for better performance
const MenuHeader = memo(function MenuHeader() {
  const { groupMembers, getCartCount, setScreen } = useApp();
  const badge = getCartCount();
  
  // Memoize avatar stack to prevent unnecessary re-renders
  const avatarStack = useMemo(() => (
    <AvatarStack people={groupMembers.map(m => ({ initials: m.initials }))} size={28} />
  ), [groupMembers]);
  
  return (
    <div className="glass" style={{
      position: 'absolute', top: 44, left: 0, right: 0, height: 56,
      borderBottom: '1px solid rgba(232,230,225,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', zIndex: 3,
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
        Lahori Darbar
      </div>
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        {avatarStack}
      </div>
      <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onClick={() => setScreen('order')}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 5h2.2l2 10.5h11.3L21 8H6.5" stroke={badge > 0 ? 'var(--ink)' : 'var(--ink-3)'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="8.5" cy="18.5" r="1.4" fill={badge > 0 ? 'var(--ink)' : 'var(--ink-3)'} />
          <circle cx="16.5" cy="18.5" r="1.4" fill={badge > 0 ? 'var(--ink)' : 'var(--ink-3)'} />
        </svg>
        {badge > 0 && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
            background: 'var(--accent)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>{badge}</div>
        )}
      </div>
    </div>
  );
});

// Optimized CategoryTabs with memo
const CategoryTabs = memo(function CategoryTabs() {
  const { selectedCategory, setSelectedCategory } = useApp();
  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 20px', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      {CATEGORIES.map((cat) => (
        <MemoChip 
          key={cat} 
          active={selectedCategory === cat} 
          muted={selectedCategory !== cat}
          onClick={() => setSelectedCategory(cat)}
        >
          {cat}
        </MemoChip>
      ))}
    </div>
  );
});

// Optimized AddBtn - CSS transform only instead of Framer Motion
// This prevents layout thrashing and ensures 60fps
const AddBtn = memo(function AddBtn({ quantity, onPlus, onMinus }: { quantity: number; onPlus?: (e?: React.MouseEvent) => void; onMinus?: (e?: React.MouseEvent) => void }) {
  const haptic = useHaptic();
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePressStart = useCallback(() => setIsPressed(true), []);
  const handlePressEnd = useCallback(() => setIsPressed(false), []);
  
  if (quantity === 0) {
    return (
      <div 
        className="button-optimized"
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 400, lineHeight: 1,
          cursor: 'pointer',
          transform: isPressed ? 'scale(0.85) translateZ(0)' : 'scale(1) translateZ(0)',
          transition: 'transform 0.1s ease',
        }}
        onClick={(e) => { 
          e.stopPropagation(); 
          haptic(); 
          onPlus?.(e); 
        }}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
      >+</div>
    );
  }
  return (
    <div 
      className="button-optimized"
      style={{
        display: 'flex', alignItems: 'center', gap: 0,
        height: 32, borderRadius: 100,
        background: 'var(--accent)', color: '#fff',
        padding: '0 4px',
        cursor: 'pointer',
        transform: isPressed ? 'scale(0.95) translateZ(0)' : 'scale(1) translateZ(0)',
        transition: 'transform 0.1s ease',
      }}
      onClick={(e) => { e.stopPropagation(); haptic(); onPlus?.(e); }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <div 
        style={{ width: 24, textAlign: 'center', fontSize: 16, lineHeight: 1, cursor: 'pointer' }} 
        onClick={(e) => { e.stopPropagation(); haptic(); onMinus?.(e); }}
      >−</div>
      <div style={{ width: 20, textAlign: 'center', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14 }}>{quantity}</div>
      <div 
        style={{ width: 24, textAlign: 'center', fontSize: 16, lineHeight: 1, cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); haptic(); onPlus?.(e); }}
      >+</div>
    </div>
  );
});

// Optimized MenuCard - CSS-only animations for 60fps scrolling
// Removes Framer Motion layout/spring physics that cause jank
const MenuCard = memo(function MenuCard({ item, quantity = 0, onPlus, onMinus, onClick }: { item: MenuItem; quantity?: number; onPlus?: (e?: React.MouseEvent) => void; onMinus?: (e?: React.MouseEvent) => void; onClick?: () => void }) {
  const haptic = useHaptic();
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePressStart = useCallback(() => setIsPressed(true), []);
  const handlePressEnd = useCallback(() => setIsPressed(false), []);
  
  // Memoize tag chip to prevent unnecessary re-renders
  const tagChip = useMemo(() => item.tag ? (
    <div style={{ marginBottom: 4 }}>
      <MemoChip size="sm">{item.tag}</MemoChip>
    </div>
  ) : null, [item.tag]);
  
  return (
    <div 
      className="button-optimized"
      style={{
        background: '#fff', borderRadius: 16, border: '1px solid var(--border)',
        padding: 12, display: 'flex', gap: 12,
        cursor: 'pointer',
        transform: isPressed ? 'scale(0.98) translateZ(0)' : 'scale(1) translateZ(0)',
        boxShadow: isPressed ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onClick={() => { haptic(); onClick?.(); }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <MemoFoodTile emoji={item.emoji} size={80} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {tagChip}
        <div style={{
          fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: 'var(--ink)',
          lineHeight: 1.2, marginTop: item.tag ? 0 : 2,
        }}>{item.name}</div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)',
          lineHeight: 1.35, marginTop: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item.desc}</div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: 'var(--accent)' }}>
            PKR {item.price.toLocaleString()}
          </div>
          <AddBtn 
            quantity={quantity} 
            onPlus={(e) => { e?.stopPropagation(); onPlus?.(e); }}
            onMinus={(e) => { e?.stopPropagation(); onMinus?.(e); }}
          />
        </div>
      </div>
    </div>
  );
});

// Optimized CartBar - CSS transform only for bottom bar animation
const CartBar = memo(function CartBar() {
  const { getCartCount, getCartTotal, setScreen } = useApp();
  const count = getCartCount();
  const total = getCartTotal();
  const haptic = useHaptic();
  const [isPressed, setIsPressed] = useState(false);
  
  if (count === 0) return null;
  
  return (
    <div 
      className="glass"
      style={{
        position: 'absolute', bottom: 34, left: 0, right: 0, height: 52,
        borderTop: '1px solid rgba(255,255,255,0.45)',
        display: 'flex', alignItems: 'center', padding: '0 20px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transform: isPressed ? 'scale(0.98) translateZ(0)' : 'scale(1) translateZ(0)',
        transition: 'transform 0.1s ease',
      }}
      onClick={() => { haptic(); setScreen('order'); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>Your Order</div>
      <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)' }}>
        {count} items · PKR {total.toLocaleString()}
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 18, color: 'var(--accent)' }}>→</div>
    </div>
  );
});

// Main MenuScreen with optimizations
export const MenuScreen = memo(function MenuScreen() {
  const { toasts, dismissToast, groupMembers, selectedCategory, selectItem, addToCart, removeFromCart } = useApp();
  const currentUser = groupMembers.find(m => m.isCurrentUser);
  
  // Use useCallback for stable references
  const getItemQty = useCallback((itemId: string) => {
    return currentUser?.items.find(i => i.id === itemId)?.quantity || 0;
  }, [currentUser]);
  
  const filteredItems = useMemo(() => 
    selectedCategory === 'All' 
      ? MENU_ITEMS 
      : MENU_ITEMS.filter(i => i.category === selectedCategory),
    [selectedCategory]
  );

  return (
    <ScreenFrame>
      <MenuHeader />
      {toasts.map(t => (
        <div key={t.id} style={{ position: 'absolute', top: 52, left: 16, right: 16, zIndex: 10 }}>
          <Toast message={t.message} success={t.success} initials={t.initials} onDismiss={() => dismissToast(t.id)} />
        </div>
      ))}
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0, bottom: 86,
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        overflowX: 'hidden',
      }}>
        <div style={{ paddingTop: 16, paddingBottom: 12 }}>
          <CategoryTabs />
        </div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredItems.map((item) => (
            <MenuCard 
              key={item.id} 
              item={item} 
              quantity={getItemQty(item.id)}
              onPlus={() => addToCart(item, 1, [])}
              onMinus={() => {
                const qty = getItemQty(item.id);
                if (qty <= 1) removeFromCart(item.id);
              }}
              onClick={() => selectItem(item)}
            />
          ))}
        </div>
      </div>
      <CartBar />
    </ScreenFrame>
  );
});