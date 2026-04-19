'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, Chip, AvatarStack, Button, Divider, FoodTile, Toast } from '../primitives';
import { CATEGORIES, MENU_ITEMS, MenuItem, CartItem } from '@/data/menu';
import { useHaptic, MenuItemSkeleton } from '../Feedback';

function MenuHeader() {
  const { groupMembers, getCartCount, setScreen } = useApp();
  const badge = getCartCount();
  return (
    <div style={{
      position: 'absolute', top: 44, left: 0, right: 0, height: 56,
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(232,230,225,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', zIndex: 3,
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
        Lahori Darbar
      </div>
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <AvatarStack people={groupMembers.map(m => ({ initials: m.initials }))} size={28} />
      </div>
      <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onClick={() => setScreen('order')}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 5h2.2l2 10.5h11.3L21 8H6.5" stroke={badge > 0 ? 'var(--ink)' : 'var(--ink-3)'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="8.5" cy="18.5" r="1.4" fill={badge > 0 ? 'var(--ink)' : 'var(--ink-3)'}/>
          <circle cx="16.5" cy="18.5" r="1.4" fill={badge > 0 ? 'var(--ink)' : 'var(--ink-3)'}/>
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
}

function CategoryTabs() {
  const { selectedCategory, setSelectedCategory } = useApp();
  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 20px', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      {CATEGORIES.map((cat) => (
        <Chip 
          key={cat} 
          active={selectedCategory === cat} 
          muted={selectedCategory !== cat}
          onClick={() => setSelectedCategory(cat)}
        >
          {cat}
        </Chip>
      ))}
    </div>
  );
}

function AddBtn({ quantity, onPlus, onMinus }: { quantity: number; onPlus?: (e?: React.MouseEvent) => void; onMinus?: (e?: React.MouseEvent) => void }) {
  const haptic = useHaptic();
  
  if (quantity === 0) {
    return (
      <motion.div 
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 400, lineHeight: 1,
          cursor: 'pointer',
        }}
        onClick={(e) => { 
          e.stopPropagation(); 
          haptic(); 
          onPlus?.(e); 
        }}
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.1 }}
      >+</motion.div>
    );
  }
  return (
    <motion.div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      height: 32, borderRadius: 100,
      background: 'var(--accent)', color: '#fff',
      padding: '0 4px',
      cursor: 'pointer',
    }}
    onClick={(e) => { e.stopPropagation(); haptic(); onPlus?.(e); }}
    whileTap={{ scale: 0.9 }}
    whileHover={{ scale: 1.02 }}
    >
      <motion.div 
        style={{ width: 24, textAlign: 'center', fontSize: 16, lineHeight: 1, cursor: 'pointer' }} 
        onClick={(e) => { e.stopPropagation(); haptic(); onMinus?.(e); }}
        whileTap={{ scale: 0.8 }}
      >−</motion.div>
      <div style={{ width: 20, textAlign: 'center', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14 }}>{quantity}</div>
      <motion.div 
        style={{ width: 24, textAlign: 'center', fontSize: 16, lineHeight: 1, cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); haptic(); onPlus?.(e); }}
        whileTap={{ scale: 0.8 }}
      >+</motion.div>
    </motion.div>
  );
}

function MenuCard({ item, quantity = 0, onPlus, onMinus, onClick }: { item: MenuItem; quantity?: number; onPlus?: (e?: React.MouseEvent) => void; onMinus?: (e?: React.MouseEvent) => void; onClick?: () => void }) {
  const haptic = useHaptic();
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        background: '#fff', borderRadius: 16, border: '1px solid var(--border)',
        padding: 12, display: 'flex', gap: 12,
        cursor: 'pointer',
      }}
      onClick={() => { haptic(); onClick?.(); }}
      whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        whileHover={{ rotate: [0, -2, 2, 0] }}
        transition={{ duration: 0.3 }}
      >
        <FoodTile emoji={item.emoji} size={80} />
      </motion.div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {item.tag && (
          <div style={{ marginBottom: 4 }}>
            <Chip size="sm">{item.tag}</Chip>
          </div>
        )}
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
    </motion.div>
  );
}

function CartBar() {
  const { getCartCount, getCartTotal, setScreen } = useApp();
  const count = getCartCount();
  const total = getCartTotal();
  const haptic = useHaptic();
  
  if (count === 0) return null;
  return (
    <motion.div
      layout
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        position: 'absolute', bottom: 34, left: 0, right: 0, height: 52,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.45)',
        display: 'flex', alignItems: 'center', padding: '0 20px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        cursor: 'pointer',
      }}
      onClick={() => { haptic(); setScreen('order'); }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>Your Order</div>
      <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)' }}>
        {count} items · PKR {total.toLocaleString()}
      </div>
      <motion.div
        animate={{ x: [0, 4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
      >
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 18, color: 'var(--accent)' }}>→</div>
      </motion.div>
    </motion.div>
  );
}

export function MenuScreen() {
  const { toasts, dismissToast, groupMembers, selectedCategory, selectItem, addToCart, removeFromCart } = useApp();
  const currentUser = groupMembers.find(m => m.isCurrentUser);
  const getItemQty = (itemId: string) => currentUser?.items.find(i => i.id === itemId)?.quantity || 0;
  const filteredItems = selectedCategory === 'All' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(i => i.category === selectedCategory);

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
}