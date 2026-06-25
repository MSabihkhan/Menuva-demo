'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, AvatarStack, FoodTile, Toast } from '../primitives';
import { CATEGORIES, MENU_ITEMS, MenuItem, RESTAURANT } from '@/data/menu';
import { useHaptic } from '../Feedback';

const MemoFoodTile = memo(FoodTile);

// ── Sticky top bar ──────────────────────────────────────────────────────────

const MenuHeader = memo(function MenuHeader() {
  const { groupMembers, getCartCount, setScreen, firebaseConnected } = useApp();
  const badge = getCartCount();

  const people = useMemo(
    () => groupMembers.filter(m => m.name).map(m => ({ initials: m.initials })),
    [groupMembers]
  );

  return (
    <div className="glass" style={{
      position: 'absolute', top: 44, left: 0, right: 0, height: 56,
      borderBottom: '1px solid rgba(232,230,225,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--ink)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          {RESTAURANT.name}
        </div>
        {firebaseConnected === false && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--error)' }} title="Offline" />
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {people.length > 0 && <AvatarStack people={people} size={26} />}
        <div
          style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => setScreen('order')}
        >
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <path d="M3 5h2.2l2 10.5h11.3L21 8H6.5" stroke={badge > 0 ? 'var(--ink)' : 'var(--ink-3)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="8.5" cy="18.5" r="1.4" fill={badge > 0 ? 'var(--ink)' : 'var(--ink-3)'} />
            <circle cx="16.5" cy="18.5" r="1.4" fill={badge > 0 ? 'var(--ink)' : 'var(--ink-3)'} />
          </svg>
          {badge > 0 && (
            <div style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
              background: 'var(--accent)', color: '#fff',
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
            }}>{badge}</div>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Hero band ───────────────────────────────────────────────────────────────

function Stars() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M7 1l1.7 3.6 3.9.5-2.9 2.7.8 3.9L7 9.9 3.5 11.7l.8-3.9L1.4 5.1l3.9-.5L7 1Z" fill="#F5A623"/>
    </svg>
  );
}

function Hero() {
  return (
    <div style={{
      margin: '0 16px', borderRadius: 20, padding: '18px 20px',
      background: 'linear-gradient(135deg, #C8760A 0%, #A8620C 55%, #7E4A0E 100%)',
      color: '#fff', position: 'relative', overflow: 'hidden',
      boxShadow: '0 10px 30px -12px rgba(168,98,12,0.55)',
    }}>
      <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', right: 26, bottom: -44, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '-0.01em', lineHeight: 1.05 }}>
        {RESTAURANT.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.92)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}><Stars /> 4.7</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <span>Burgers · Pizza · Fries</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <span>Dine-in</span>
      </div>
      <div style={{
        marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.16)', borderRadius: 100, padding: '5px 12px',
        fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
        border: '1px solid rgba(255,255,255,0.2)',
      }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1a4.5 4.5 0 0 0-4.5 4.5C2.5 9 7 13 7 13s4.5-4 4.5-7.5A4.5 4.5 0 0 0 7 1Z" stroke="#fff" strokeWidth="1.3" fill="none"/><circle cx="7" cy="5.4" r="1.5" fill="#fff"/></svg>
        {RESTAURANT.table} · Ordering together
      </div>
    </div>
  );
}

// ── Search ──────────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ margin: '0 16px', position: 'relative' }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
        <circle cx="8" cy="8" r="5.5" stroke="var(--ink-3)" strokeWidth="1.6"/>
        <path d="M12.5 12.5L16 16" stroke="var(--ink-3)" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search dishes…"
        style={{
          width: '100%', height: 46, borderRadius: 14, border: '1px solid var(--border)',
          background: 'var(--surface)', padding: '0 16px 0 40px',
          fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--ink)',
        }}
      />
      {value && (
        <div onClick={() => onChange('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', fontSize: 18, cursor: 'pointer', padding: 4 }}>×</div>
      )}
    </div>
  );
}

// ── Category rail ───────────────────────────────────────────────────────────

const CategoryRail = memo(function CategoryRail() {
  const { selectedCategory, setSelectedCategory } = useApp();
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '0 16px',
      overflowX: 'auto', overflowY: 'hidden',
      WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
    }}>
      {CATEGORIES.map(cat => {
        const active = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              flexShrink: 0, padding: '9px 16px', borderRadius: 100,
              background: active ? 'var(--accent)' : '#fff',
              color: active ? '#fff' : 'var(--ink-2)',
              border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13.5,
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: active ? '0 6px 16px -8px rgba(200,118,10,0.7)' : 'none',
              transition: 'transform 0.12s ease',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
});

// ── Add control (overlaps the dish photo) ───────────────────────────────────

const AddControl = memo(function AddControl({ quantity, onPlus, onMinus }: {
  quantity: number; onPlus: (e: React.MouseEvent) => void; onMinus: (e: React.MouseEvent) => void;
}) {
  const haptic = useHaptic();
  const wrap: React.CSSProperties = {
    position: 'absolute', right: -8, bottom: -12,
    background: '#fff', borderRadius: 100,
    boxShadow: '0 4px 14px rgba(0,0,0,0.16)',
    display: 'flex', alignItems: 'center', height: 34,
  };
  if (quantity === 0) {
    return (
      <div
        style={{ ...wrap, width: 34, justifyContent: 'center', cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); haptic(); onPlus(e); }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3.5v11M3.5 9h11" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }
  return (
    <div style={{ ...wrap, padding: '0 4px', gap: 2 }}>
      <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); haptic(); onMinus(e); }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"/></svg>
      </div>
      <div style={{ minWidth: 16, textAlign: 'center', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{quantity}</div>
      <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); haptic(); onPlus(e); }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3.5v9M3.5 8h9" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"/></svg>
      </div>
    </div>
  );
});

// ── Dish row (Foodpanda style: content left, photo right) ────────────────────

const MenuCard = memo(function MenuCard({ item, quantity, onPlus, onMinus, onClick }: {
  item: MenuItem; quantity: number;
  onPlus: (e: React.MouseEvent) => void; onMinus: (e: React.MouseEvent) => void; onClick: () => void;
}) {
  const haptic = useHaptic();
  const [pressed, setPressed] = useState(false);
  return (
    <div
      style={{
        display: 'flex', gap: 14, padding: '14px 0', cursor: 'pointer',
        borderBottom: '1px solid var(--surface)',
        transform: pressed ? 'scale(0.99)' : 'scale(1)', transition: 'transform 0.15s ease',
      }}
      onClick={() => { haptic(); onClick(); }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {item.tag && (
          <div style={{
            alignSelf: 'flex-start', marginBottom: 5, padding: '2px 8px', borderRadius: 6,
            background: 'var(--accent-surface)', color: 'var(--accent)',
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>{item.tag}</div>
        )}
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.25 }}>{item.name}</div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4, marginTop: 4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.desc}</div>
        <div style={{ flex: 1 }} />
        <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
          PKR {item.price.toLocaleString()}
        </div>
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <MemoFoodTile emoji={item.emoji} image={item.image} alt={item.name} size={104} radius={16} />
        <AddControl quantity={quantity} onPlus={onPlus} onMinus={onMinus} />
      </div>
    </div>
  );
});

// ── Cart bar ────────────────────────────────────────────────────────────────

const CartBar = memo(function CartBar() {
  const { getCartCount, getCartTotal, setScreen } = useApp();
  const count = getCartCount();
  const total = getCartTotal();
  const haptic = useHaptic();
  const [pressed, setPressed] = useState(false);
  if (count === 0) return null;
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px calc(16px + env(safe-area-inset-bottom, 0px))', background: 'linear-gradient(to top, var(--bg) 60%, transparent)', zIndex: 6 }}>
      <div
        onClick={() => { haptic(); setScreen('order'); }}
        onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
        style={{
          height: 56, borderRadius: 16, background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', padding: '0 8px 0 18px', cursor: 'pointer',
          boxShadow: '0 12px 30px -10px rgba(200,118,10,0.7)',
          transform: pressed ? 'scale(0.98)' : 'scale(1)', transition: 'transform 0.12s ease',
        }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13 }}>{count}</div>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15 }}>View order</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 12, height: 40, padding: '0 14px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15 }}>
          PKR {total.toLocaleString()}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 3l5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </div>
  );
});

// ── Screen ──────────────────────────────────────────────────────────────────

export const MenuScreen = memo(function MenuScreen() {
  const { toasts, dismissToast, groupMembers, selectedCategory, selectItem, setScreen, addToCart, decrementFromCart, getCartCount } = useApp();
  const currentUser = groupMembers.find(m => m.isCurrentUser);
  const [query, setQuery] = useState('');

  const getItemQty = useCallback((itemId: string) =>
    currentUser?.items.find(i => i.id === itemId)?.quantity || 0,
    [currentUser]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MENU_ITEMS.filter(i => {
      const inCat = selectedCategory === 'All' || i.category === selectedCategory;
      const inQuery = !q || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [selectedCategory, query]);

  const hasCart = getCartCount() > 0;

  return (
    <ScreenFrame>
      <MenuHeader />

      {/* Toasts */}
      {toasts.map((t, idx) => (
        <div key={t.id} style={{ position: 'absolute', top: `calc(${108 + idx * 58}px + env(safe-area-inset-top, 0px))`, left: 16, right: 16, zIndex: 10 }}>
          <Toast message={t.message} success={t.success} initials={t.initials} onDismiss={() => dismissToast(t.id)} />
        </div>
      ))}

      {/* Scroll area */}
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0, bottom: 0,
        overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        paddingBottom: hasCart ? 96 : 24,
      }}>
        <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Hero />
          <SearchBar value={query} onChange={setQuery} />
          <CategoryRail />

          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                {selectedCategory === 'All' ? 'Full Menu' : selectedCategory}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)' }}>
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)' }}>
                No dishes match “{query}”.
              </div>
            ) : (
              filteredItems.map(item => (
                <MenuCard
                  key={item.id}
                  item={item}
                  quantity={getItemQty(item.id)}
                  onPlus={() => addToCart(item, 1, [])}
                  onMinus={() => decrementFromCart(item.id)}
                  onClick={() => { selectItem(item); setScreen('detail'); }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <CartBar />
    </ScreenFrame>
  );
});
