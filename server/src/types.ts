// Shared backend types. Kept deliberately close to the frontend's
// src/data/menu.ts shapes so payloads line up without translation.

export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  tag: string | null;
  emoji: string;
  category: string;
  spicy?: boolean;
  gluten?: boolean;
  modelUrl?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  extras: string[];
}

// One person's live cart, as stored under tables/{id}/members/{sid}.
export interface FirebaseMember {
  id: string;
  name: string;
  initials: string;
  itemsJson: string; // stringified CartItem[]
  joinedAt: number;
}

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'served';

// The valid forward transitions the kitchen may make.
export const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  placed: 'preparing',
  preparing: 'ready',
  ready: 'served',
  served: null,
};

export interface OrderLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  extras: string[];
  byName: string; // who added it
  bySid: string;
}

// A placed order = one queue. Lives at tables/{id}/orders/{orderId}.
export interface Order {
  id: string;
  round: number;
  placedAt: number;
  etaMinutes: number;
  status: OrderStatus;
  lineItems: OrderLineItem[];
  paid?: boolean;
  paymentMethod?: string;
  paidAt?: number;
  kitchenNotes?: string;
}
