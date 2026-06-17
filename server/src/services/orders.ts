import { ref, get, set, update, remove, push } from 'firebase/database';
import { db } from '../firebase';
import { QUEUE_WINDOW_MS, DEFAULT_ETA_MIN } from '../config';
import {
  CartItem, FirebaseMember, Order, OrderLineItem, OrderStatus, STATUS_FLOW,
} from '../types';

// ─── Paths ────────────────────────────────────────────────────────────────────

const membersPath = (t: string) => `tables/${t}/members`;
const ordersPath = (t: string) => `tables/${t}/orders`;
const orderPath = (t: string, id: string) => `tables/${t}/orders/${id}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseItems(json: string): CartItem[] {
  try { return JSON.parse(json || '[]'); } catch { return []; }
}

// RTDB sometimes returns arrays as objects — normalise back to an array.
function toArray<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean) as T[];
  return Object.values(val as Record<string, T>);
}

function normalizeOrder(id: string, raw: Record<string, unknown>): Order {
  return {
    id,
    round: Number(raw.round) || 1,
    placedAt: Number(raw.placedAt) || 0,
    etaMinutes: Number(raw.etaMinutes) || DEFAULT_ETA_MIN,
    status: (raw.status as OrderStatus) || 'placed',
    lineItems: toArray<OrderLineItem>(raw.lineItems),
    paid: !!raw.paid,
    paymentMethod: raw.paymentMethod as string | undefined,
    paidAt: raw.paidAt as number | undefined,
    kitchenNotes: raw.kitchenNotes as string | undefined,
  };
}

const lineKey = (li: OrderLineItem) => `${li.id}|${JSON.stringify(li.extras)}|${li.bySid}`;

// Combine duplicate line items (same dish + extras + person) by summing qty.
function mergeLines(existing: OrderLineItem[], incoming: OrderLineItem[]): OrderLineItem[] {
  const map = new Map<string, OrderLineItem>();
  for (const li of [...existing, ...incoming]) {
    const k = lineKey(li);
    const prev = map.get(k);
    if (prev) prev.quantity += li.quantity;
    else map.set(k, { ...li });
  }
  return [...map.values()];
}

export function orderTotal(o: Order): { subtotal: number; tax: number; total: number } {
  const subtotal = o.lineItems.reduce((s, li) => s + li.price * li.quantity, 0);
  const tax = Math.round(subtotal * 0.16);
  return { subtotal, tax, total: subtotal + tax };
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function readMembers(tableId: string): Promise<FirebaseMember[]> {
  const snap = await get(ref(db, membersPath(tableId)));
  const val = snap.val() as Record<string, FirebaseMember> | null;
  return val ? Object.values(val).filter(m => m && m.name) : [];
}

export async function readOrders(tableId: string): Promise<Order[]> {
  const snap = await get(ref(db, ordersPath(tableId)));
  const val = snap.val() as Record<string, Record<string, unknown>> | null;
  if (!val) return [];
  return Object.entries(val)
    .map(([id, raw]) => normalizeOrder(id, raw))
    .sort((a, b) => a.placedAt - b.placedAt);
}

// Flatten every member's current cart into placeable line items.
function gatherPending(members: FirebaseMember[]): OrderLineItem[] {
  const lines: OrderLineItem[] = [];
  for (const m of members) {
    for (const it of parseItems(m.itemsJson)) {
      lines.push({
        id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        extras: it.extras || [],
        byName: m.name,
        bySid: m.id,
      });
    }
  }
  return lines;
}

async function clearCarts(tableId: string, members: FirebaseMember[]): Promise<void> {
  const updates: Record<string, string> = {};
  for (const m of members) updates[`${m.id}/itemsJson`] = '[]';
  if (Object.keys(updates).length) await update(ref(db, membersPath(tableId)), updates);
}

// ─── Place order (the core 5-minute-rule logic) ───────────────────────────────

export interface PlaceResult {
  order: Order;
  merged: boolean;      // folded into the previous queue (within 5 min)
  totals: ReturnType<typeof orderTotal>;
}

export async function placeOrder(tableId: string, kitchenNotes?: string): Promise<PlaceResult> {
  const members = await readMembers(tableId);
  const pending = gatherPending(members);
  if (pending.length === 0) {
    throw Object.assign(new Error('Cart is empty — nothing to place.'), { status: 400 });
  }

  const orders = await readOrders(tableId);
  const latest = orders.length ? orders[orders.length - 1] : null;
  const now = Date.now();

  // 5-minute rule: within the window → fold into the last queue.
  if (latest && now - latest.placedAt <= QUEUE_WINDOW_MS) {
    const lineItems = mergeLines(latest.lineItems, pending);
    const merged: Order = {
      ...latest,
      lineItems,
      kitchenNotes: kitchenNotes || latest.kitchenNotes,
    };
    await update(ref(db, orderPath(tableId, latest.id)), {
      lineItems,
      kitchenNotes: merged.kitchenNotes ?? null,
    });
    await clearCarts(tableId, members);
    return { order: merged, merged: true, totals: orderTotal(merged) };
  }

  // Otherwise a new queue.
  const maxRound = orders.reduce((m, o) => Math.max(m, o.round), 0);
  const newRef = push(ref(db, ordersPath(tableId)));
  const id = newRef.key as string;
  const order: Order = {
    id,
    round: maxRound + 1,
    placedAt: now,
    etaMinutes: DEFAULT_ETA_MIN,
    status: 'placed',
    lineItems: pending,
    kitchenNotes: kitchenNotes || undefined,
  };
  await set(newRef, {
    round: order.round,
    placedAt: order.placedAt,
    etaMinutes: order.etaMinutes,
    status: order.status,
    lineItems: order.lineItems,
    ...(kitchenNotes ? { kitchenNotes } : {}),
  });
  await clearCarts(tableId, members);
  return { order, merged: false, totals: orderTotal(order) };
}

// ─── Kitchen: advance status ──────────────────────────────────────────────────

export async function advanceStatus(
  tableId: string, orderId: string, to?: OrderStatus,
): Promise<Order> {
  const snap = await get(ref(db, orderPath(tableId, orderId)));
  const raw = snap.val() as Record<string, unknown> | null;
  if (!raw) throw Object.assign(new Error('Order not found.'), { status: 404 });

  const current = normalizeOrder(orderId, raw);
  const next = to ?? STATUS_FLOW[current.status];
  if (!next) {
    throw Object.assign(new Error(`Order is already ${current.status}.`), { status: 409 });
  }
  // Forward-only: the target must be the legal next step.
  if (to && STATUS_FLOW[current.status] !== to) {
    throw Object.assign(
      new Error(`Illegal transition ${current.status} → ${to}.`), { status: 409 },
    );
  }
  await update(ref(db, orderPath(tableId, orderId)), { status: next });
  return { ...current, status: next };
}

// ─── Payment (demo) ───────────────────────────────────────────────────────────

export async function payOrder(
  tableId: string, orderId: string, method: string,
): Promise<Order> {
  const snap = await get(ref(db, orderPath(tableId, orderId)));
  const raw = snap.val() as Record<string, unknown> | null;
  if (!raw) throw Object.assign(new Error('Order not found.'), { status: 404 });

  const paidAt = Date.now();
  await update(ref(db, orderPath(tableId, orderId)), {
    paid: true, paymentMethod: method, paidAt,
  });
  return { ...normalizeOrder(orderId, raw), paid: true, paymentMethod: method, paidAt };
}

// ─── Reset the table for the next group ───────────────────────────────────────

export async function resetTable(tableId: string): Promise<void> {
  const members = await readMembers(tableId);
  await remove(ref(db, ordersPath(tableId)));
  await clearCarts(tableId, members);
}
