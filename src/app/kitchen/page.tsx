'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { GroupMember, CartItem } from '@/data/menu';

interface FirebaseMember {
  id: string;
  name: string;
  initials: string;
  itemsJson: string;
  joinedAt: number;
}

function parseItems(json: string): CartItem[] {
  try { return JSON.parse(json || '[]'); } catch { return []; }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  idle:      { label: 'Waiting for order',  color: '#A39E99', bg: '#F0EEE9' },
  placed:    { label: 'Order received ✓',   color: '#C8760A', bg: '#FEF3E2' },
  preparing: { label: 'Preparing…',         color: '#2D6A4F', bg: '#EAF3DE' },
  ready:     { label: 'Ready to serve! 🎉', color: '#2D6A4F', bg: '#EAF3DE' },
};

function ConnDot({ connected }: { connected: boolean | null }) {
  const color = connected === null ? '#A39E99' : connected ? '#2D6A4F' : '#B94040';
  const label = connected === null ? 'Connecting…' : connected ? 'Live' : 'Offline';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
    </div>
  );
}

function GuestCard({ member }: { member: GroupMember }) {
  const subtotal = member.items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #D6D2CB' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#C8760A', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: 13, flexShrink: 0,
        }}>{member.initials}</div>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#1A1918' }}>{member.name}</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6B6560' }}>
          {member.items.length} item{member.items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {member.items.length === 0 ? (
        <div style={{ fontSize: 13, color: '#A39E99', padding: '4px 0' }}>No items yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {member.items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 14, color: '#1A1918',
              padding: '7px 0', borderBottom: '1px solid #F0EEE9',
            }}>
              <span>{item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name}</span>
              <span style={{ color: '#6B6560', fontSize: 13 }}>PKR {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1918' }}>Subtotal</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#C8760A' }}>PKR {subtotal.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KitchenPage() {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [orderStatus, setOrderStatus] = useState('idle');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const unsubConn = onValue(ref(db, '.info/connected'), snap => {
      setConnected(snap.val() === true);
    });

    const unsubMembers = onValue(ref(db, 'tables/T7/members'), snap => {
      const data = snap.val() as Record<string, FirebaseMember> | null;
      setMembers(
        data
          ? Object.values(data)
              .filter(m => m.name)
              .sort((a, b) => a.joinedAt - b.joinedAt)
              .map(m => ({
                id: m.id, name: m.name, initials: m.initials,
                items: parseItems(m.itemsJson), isCurrentUser: false,
              }))
          : []
      );
      setLastUpdated(new Date().toLocaleTimeString());
    });

    const unsubStatus = onValue(ref(db, 'tables/T7/orderStatus'), snap => {
      setOrderStatus(snap.val() || 'idle');
    });

    return () => { unsubConn(); unsubMembers(); unsubStatus(); };
  }, []);

  const cfg = STATUS_CONFIG[orderStatus] ?? STATUS_CONFIG.idle;
  const totalItems = members.reduce((t, m) => t + m.items.reduce((s, i) => s + i.quantity, 0), 0);
  const totalAmount = members.reduce((t, m) => t + m.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
  const tax = Math.round(totalAmount * 0.16);

  return (
    <div style={{ minHeight: '100vh', background: '#F0EEE9', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#1A1918', padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 22, color: '#fff', letterSpacing: '-0.01em' }}>
            Lahori Darbar — Kitchen View
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            Table 7 · Real-time orders
          </div>
        </div>
        <ConnDot connected={connected} />
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1024, margin: '0 auto' }}>
        {/* Status + totals banner */}
        <div style={{
          background: cfg.bg, borderRadius: 16, padding: '18px 22px',
          border: `1.5px solid ${cfg.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#1A1918' }}>{cfg.label}</div>
              {lastUpdated && (
                <div style={{ fontSize: 12, color: '#6B6560', marginTop: 2 }}>Updated {lastUpdated}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Items</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1918' }}>{totalItems}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subtotal</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#C8760A' }}>PKR {totalAmount.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>With Tax</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1918' }}>PKR {(totalAmount + tax).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Guest cards */}
        {members.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 16, padding: 56,
            textAlign: 'center', color: '#A39E99', fontSize: 15,
          }}>
            No guests at the table yet. Waiting for orders…
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {members.map(m => <GuestCard key={m.id} member={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}
