// Thin client for the Menuva backend. Live cart/presence stays on Firebase
// direct; this routes the *decisions* (place order, kitchen status, pay, reset)
// through Express so the queue logic lives in one authoritative place.
import type { Order, OrderStatus } from '@/data/menu';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') || 'http://localhost:4000/api';

async function req<T>(path: string, opts?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts?.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export interface PlaceResult {
  order: Order;
  merged: boolean;
  totals: { subtotal: number; tax: number; total: number };
}

export const api = {
  placeOrder: (tableId: string, kitchenNotes?: string) =>
    req<PlaceResult>(`/tables/${tableId}/orders`, { method: 'POST', body: { kitchenNotes } }),

  advanceStatus: (tableId: string, orderId: string, status?: OrderStatus) =>
    req<{ order: Order }>(`/tables/${tableId}/orders/${orderId}/status`, {
      method: 'PATCH', body: { status },
    }),

  payOrder: (tableId: string, orderId: string, method: string) =>
    req<{ order: Order }>(`/tables/${tableId}/orders/${orderId}/pay`, {
      method: 'POST', body: { method },
    }),

  resetTable: (tableId: string) =>
    req<{ ok: boolean }>(`/tables/${tableId}/reset`, { method: 'POST' }),
};
