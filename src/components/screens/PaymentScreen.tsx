'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ScreenFrame, BackButton, Divider } from '../primitives';
import type { GroupMember } from '@/data/menu';

type PayScope = 'mine' | 'all';
type PayMethod = 'jazz' | 'easy' | 'card';

// ── Small components ─────────────────────────────────────────────────────────

function SheetHandle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
    </div>
  );
}

function PayLogo({ name, color }: { name: string; color?: string }) {
  return (
    <div style={{
      width: 44, height: 30, borderRadius: 7,
      background: 'var(--surface)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, color: color || 'var(--ink-2)',
      letterSpacing: '0.04em', flexShrink: 0,
    }}>{name}</div>
  );
}

function PayOption({ label, logo, color, selected, onClick }: {
  label: string; logo: string; color?: string; selected?: boolean; onClick?: () => void;
}) {
  return (
    <div
      style={{
        height: 56, borderRadius: 12, background: '#fff',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer', transition: 'border-color 0.15s ease',
      }}
      onClick={onClick}
    >
      <PayLogo name={logo} color={color} />
      <div style={{ flex: 1, fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: 'var(--ink)' }}>
        {label}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--accent)' }} />}
      </div>
    </div>
  );
}

function MemberBillCard({ member, highlight }: { member: GroupMember; highlight?: boolean }) {
  const subtotal = member.items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div style={{
      background: highlight ? 'var(--accent-surface)' : 'var(--surface)',
      borderRadius: 14,
      border: `1px solid ${highlight ? 'rgba(200,118,10,0.25)' : 'var(--border)'}`,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: highlight ? 'var(--accent)' : 'var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12,
          color: highlight ? '#fff' : 'var(--ink-2)',
          flexShrink: 0,
        }}>
          {member.initials}
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--ink)', flex: 1 }}>
          {member.name}{highlight ? ' (you)' : ''}
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>
          PKR {subtotal.toLocaleString()}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {member.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)',
          }}>
            <span>{item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name}</span>
            <span>PKR {(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PAY_METHOD_LABELS: Record<string, string> = {
  jazz: 'JazzCash',
  easy: 'EasyPaisa',
  card: 'Card',
};

function SuccessState({ amount, coveredAll, guestCount, payMethod, items, onDone, onSendReceipt }: {
  amount: number; coveredAll: boolean; guestCount: number; payMethod: string;
  items: { name: string; price: number; quantity: number }[];
  onDone: () => void;
  onSendReceipt: () => void;
}) {
  const orderNumber = React.useRef(Date.now().toString(36).toUpperCase().slice(-6)).current;
  return (
    <div style={{
      flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '28px 24px 16px', gap: 20,
    }}>
      {/* Check icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--success-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'successPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        flexShrink: 0,
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M7 17 13 23 25 11" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Title + meta */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          Payment received!
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>
          Order #{orderNumber} · via {PAY_METHOD_LABELS[payMethod] ?? payMethod}
        </div>
        {coveredAll && guestCount > 0 && (
          <div style={{
            marginTop: 8,
            fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--success)', fontWeight: 500,
          }}>
            You picked up the tab for {guestCount} other{guestCount !== 1 ? 's' : ''} — very generous! 🎉
          </div>
        )}
      </div>

      {/* Receipt breakdown */}
      {items.length > 0 && (
        <div style={{ width: '100%', background: 'var(--surface)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 11,
            color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
          }}>Receipt</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)',
              }}>
                <span>{item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name}</span>
                <span>PKR {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                Total paid
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
                PKR {amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <button
          style={{
            width: '100%', height: 52, borderRadius: 100,
            background: 'var(--ink)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15,
            border: 'none', cursor: 'pointer',
          }}
          onClick={onDone}
        >
          Done — New Session
        </button>
        <button
          style={{
            width: '100%', height: 44, borderRadius: 100,
            background: 'transparent', color: 'var(--ink-2)',
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14,
            border: '1.5px solid var(--border)', cursor: 'pointer',
          }}
          onClick={onSendReceipt}
        >
          📱 Send receipt to my phone
        </button>
      </div>

      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>
        Thanks for dining with us! 🍽️
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function PaymentScreen() {
  const { goBack, groupMembers, showToast, resetOrder } = useApp();
  const [payScope, setPayScope] = useState<PayScope>('mine');
  const [selectedPay, setSelectedPay] = useState<PayMethod>('jazz');
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paidWithMethod, setPaidWithMethod] = useState<PayMethod>('jazz');
  const [paidItems, setPaidItems] = useState<{ name: string; price: number; quantity: number }[]>([]);

  const currentUser = groupMembers.find(m => m.isCurrentUser);
  const allWithItems = groupMembers.filter(m => m.items.length > 0);
  const others = groupMembers.filter(m => !m.isCurrentUser && m.items.length > 0);

  // Redirect back if there's nothing to pay for
  useEffect(() => {
    if (allWithItems.length === 0) goBack();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mySubtotal = currentUser?.items.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;
  const tableSubtotal = allWithItems.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.price * i.quantity, 0), 0
  );

  const paySubtotal = payScope === 'mine' ? mySubtotal : tableSubtotal;
  const payAmount = Math.round(paySubtotal * 1.16);
  const hasGroup = others.length > 0;

  const handlePay = async () => {
    if (payAmount === 0) {
      showToast('No items to pay for!');
      return;
    }
    setPaying(true);
    await new Promise(r => setTimeout(r, 1200));
    setPaying(false);
    setPaidWithMethod(selectedPay);
    // Capture items at time of payment for the receipt
    const receiptMembers = payScope === 'all' ? allWithItems : (currentUser ? [currentUser] : []);
    setPaidItems(receiptMembers.flatMap(m => m.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity }))));
    setPaid(true);
    showToast('Payment successful!', undefined, true);
  };

  const handleDone = async () => { await resetOrder(); };
  const handleSendReceipt = () => showToast('Receipt sent to your number!', undefined, true);

  if (!currentUser) return null;

  return (
    <ScreenFrame>
      <BackButton onClick={goBack} />

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: '92%',
        background: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.12)',
        animation: 'slideUpSheet 0.35s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <SheetHandle />

        {/* Header */}
        <div style={{
          padding: '4px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)',
            letterSpacing: '-0.01em', marginBottom: 12,
          }}>
            Time to settle up
          </div>

          {/* Pay scope toggle — only show if others have items */}
          {hasGroup && (
            <div style={{
              display: 'flex', gap: 8,
              background: 'var(--surface)', borderRadius: 100, padding: 4,
            }}>
              {(['mine', 'all'] as PayScope[]).map(scope => (
                <button
                  key={scope}
                  style={{
                    flex: 1, height: 36, borderRadius: 100,
                    background: payScope === scope ? '#fff' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13,
                    color: payScope === scope ? 'var(--ink)' : 'var(--ink-3)',
                    boxShadow: payScope === scope ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setPayScope(scope)}
                >
                  {scope === 'mine'
                    ? `My share · PKR ${Math.round(mySubtotal * 1.16).toLocaleString()}`
                    : `Full table · PKR ${Math.round(tableSubtotal * 1.16).toLocaleString()}`}
                </button>
              ))}
            </div>
          )}

          {!hasGroup && (
            <div style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 22, color: 'var(--accent)',
            }}>
              PKR {payAmount.toLocaleString()}
            </div>
          )}
        </div>

        {paid ? (
          <SuccessState
            amount={payAmount}
            coveredAll={payScope === 'all'}
            guestCount={others.length}
            payMethod={paidWithMethod}
            items={paidItems}
            onDone={handleDone}
            onSendReceipt={handleSendReceipt}
          />
        ) : (
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* Bill breakdown */}
            {payScope === 'all' && hasGroup ? (
              <>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12,
                  color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Full table breakdown</div>
                {allWithItems.map(m => (
                  <MemberBillCard key={m.id} member={m} highlight={m.isCurrentUser} />
                ))}
              </>
            ) : (
              <>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12,
                  color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Your items</div>
                {currentUser.items.length === 0 ? (
                  <div style={{
                    background: 'var(--surface)', borderRadius: 14, padding: 20,
                    textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)',
                  }}>
                    You haven't added any items yet.
                  </div>
                ) : (
                  <MemberBillCard member={currentUser} highlight />
                )}
              </>
            )}

            {/* Tax line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 2px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)' }}>
                Tax (16%)
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)' }}>
                PKR {(payAmount - paySubtotal).toLocaleString()}
              </span>
            </div>

            <Divider style={{ margin: '0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>
                {payScope === 'all' ? 'Table total' : 'Your total'}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
                PKR {payAmount.toLocaleString()}
              </span>
            </div>

            {/* Full-table notice */}
            {payScope === 'all' && hasGroup && (
              <div style={{
                background: 'var(--accent-surface)', borderRadius: 12, padding: '10px 14px',
                fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--accent)',
                border: '1px solid rgba(200,118,10,0.2)',
              }}>
                You're picking up the tab for {others.length} other{others.length !== 1 ? 's' : ''} — that's very generous!
              </div>
            )}

            {/* Payment methods */}
            <div style={{
              fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4,
            }}>Pay with</div>

            <PayOption label="JazzCash" logo="JAZZ" color="#B2092E" selected={selectedPay === 'jazz'} onClick={() => setSelectedPay('jazz')} />
            <PayOption label="EasyPaisa" logo="EP" color="#00A651" selected={selectedPay === 'easy'} onClick={() => setSelectedPay('easy')} />
            <PayOption label="Credit or Debit Card" logo="CARD" selected={selectedPay === 'card'} onClick={() => setSelectedPay('card')} />

            {/* Pay CTA */}
            <div style={{ marginTop: 4, paddingBottom: 8 }}>
              <button
                style={{
                  width: '100%', height: 52, borderRadius: 100,
                  background: paying ? 'var(--ink-3)' : 'var(--accent)',
                  color: '#fff',
                  fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16,
                  border: 'none', cursor: paying ? 'default' : 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onClick={handlePay}
                disabled={paying || payAmount === 0}
              >
                {paying ? 'Processing…' : `Pay PKR ${payAmount.toLocaleString()}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
