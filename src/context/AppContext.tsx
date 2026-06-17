'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartItem, GroupMember, Toast, MenuItem, Order, OrderLineItem, OrderStatus } from '@/data/menu';
import { db } from '@/lib/firebase';
import { ref, set, update, remove, onValue, onDisconnect } from 'firebase/database';
import { api } from '@/lib/api';

export type Screen = 'welcome' | 'menu' | 'detail' | 'viewer3d' | 'order' | 'waiting' | 'payment';

const MAX_TOASTS = 3;
const TOAST_DURATION = 3000;
const TABLE_ID = 'T7';
const QUEUE_WINDOW_MS = 5 * 60 * 1000; // 5-min rule: adds beyond this start a new queue

interface FirebaseMember {
  id: string;
  name: string;
  initials: string;
  itemsJson: string;
  joinedAt: number;
}

interface AppState {
  screen: Screen;
  userName: string;
  hasGroup: boolean;
  groupMembers: GroupMember[];
  selectedItem: MenuItem | null;
  toasts: Toast[];
  newJoiner: { name: string; initials: string } | null;
  orders: Order[];
  queueNotice: { round: number } | null;
  showPayment: boolean;
  itemQuantity: number;
  itemExtras: string[];
  selectedCategory: string;
  firebaseConnected: boolean | null;
}

interface AppContextType extends AppState {
  sessionId: string;
  tableId: string;
  firebaseConnected: boolean | null;
  newJoiner: { name: string; initials: string } | null;
  setScreen: (s: Screen) => void;
  setUserName: (name: string) => void;
  setHasGroup: (has: boolean) => void;
  selectItem: (item: MenuItem | null) => void;
  addToCart: (item: MenuItem, quantity: number, extras: string[]) => void;
  removeFromCart: (itemId: string) => void;
  decrementFromCart: (itemId: string) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  showToast: (message: string, initials?: string, success?: boolean) => void;
  dismissToast: (id: string) => void;
  placeOrder: (kitchenNotes?: string) => Promise<void>;
  clearQueueNotice: () => void;
  setShowPayment: (show: boolean) => void;
  setItemQuantity: (qty: number) => void;
  addItemExtra: (extraId: string) => void;
  removeItemExtra: (extraId: string) => void;
  setSelectedCategory: (cat: string) => void;
  clearNewJoiner: () => void;
  goBack: () => void;
  joinTable: (name: string) => Promise<void>;
  resetOrder: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let id = localStorage.getItem('menuva-session-id');
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('menuva-session-id', id);
    }
    return id;
  } catch {
    return `tmp-${Date.now()}`;
  }
}

function loadPersistedState(): { userName: string; currentUserItems: CartItem[] } {
  if (typeof window === 'undefined') return { userName: '', currentUserItems: [] };
  try {
    const raw = localStorage.getItem('menuva-state');
    if (!raw) return { userName: '', currentUserItems: [] };
    const parsed = JSON.parse(raw);
    const currentUser = (parsed.groupMembers || []).find((m: GroupMember) => m.isCurrentUser);
    return {
      userName: parsed.userName || '',
      currentUserItems: currentUser?.items || [],
    };
  } catch {
    return { userName: '', currentUserItems: [] };
  }
}

function parseItems(itemsJson: string): CartItem[] {
  try { return JSON.parse(itemsJson || '[]'); } catch { return []; }
}

function toArray<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean) as T[];
  return Object.values(val as Record<string, T>);
}

function parseOrders(val: unknown): Order[] {
  if (!val) return [];
  return Object.entries(val as Record<string, Record<string, unknown>>)
    .map(([id, raw]) => ({
      id,
      round: Number(raw.round) || 1,
      placedAt: Number(raw.placedAt) || 0,
      etaMinutes: Number(raw.etaMinutes) || 18,
      status: (raw.status as OrderStatus) || 'placed',
      lineItems: toArray<OrderLineItem>(raw.lineItems),
      paid: !!raw.paid,
      paymentMethod: raw.paymentMethod as string | undefined,
      paidAt: raw.paidAt as number | undefined,
      kitchenNotes: raw.kitchenNotes as string | undefined,
    }))
    .sort((a, b) => a.placedAt - b.placedAt);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const sessionId = useRef(getOrCreateSessionId()).current;

  const toastsRef = useRef<Toast[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevOthersRef = useRef<GroupMember[]>([]);
  const toastTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { userName: savedName } = loadPersistedState();

  // Ref so cart callbacks can read current members without stale closures
  const groupMembersRef = useRef<GroupMember[]>([]);
  const ordersRef = useRef<Order[]>([]);

  const [state, setState] = useState<AppState>({
    screen: 'welcome',
    userName: savedName,
    hasGroup: false,
    groupMembers: [{
      id: sessionId,
      name: savedName,
      initials: savedName ? savedName.substring(0, 2).toUpperCase() : '',
      items: [],
      isCurrentUser: true,
    }],
    selectedItem: null,
    toasts: [],
    newJoiner: null,
    orders: [],
    queueNotice: null,
    showPayment: false,
    itemQuantity: 1,
    itemExtras: [],
    selectedCategory: 'All',
    firebaseConnected: null,
  });

  // Keep ref current so cart callbacks don't capture stale state
  useEffect(() => { groupMembersRef.current = state.groupMembers; }, [state.groupMembers]);
  useEffect(() => { ordersRef.current = state.orders; }, [state.orders]);

  // ─── Toast helpers ──────────────────────────────────────────────────────────

  const addToast = useCallback((toast: Toast) => {
    if (toastsRef.current.length >= MAX_TOASTS) {
      const oldestId = toastsRef.current[0].id;
      const t = toastTimeoutsRef.current.get(oldestId);
      if (t) { clearTimeout(t); toastTimeoutsRef.current.delete(oldestId); }
      toastsRef.current = toastsRef.current.slice(1);
    }
    toastsRef.current = [...toastsRef.current, toast];
    setToasts([...toastsRef.current]);
    const timeoutId = setTimeout(() => {
      toastsRef.current = toastsRef.current.filter(t => t.id !== toast.id);
      setToasts([...toastsRef.current]);
      toastTimeoutsRef.current.delete(toast.id);
    }, TOAST_DURATION);
    toastTimeoutsRef.current.set(toast.id, timeoutId);
  }, []);

  // ─── Firebase: listen to all table members ──────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const membersRef = ref(db, `tables/${TABLE_ID}/members`);

    const unsub = onValue(membersRef, (snapshot) => {
      const data = snapshot.val() as Record<string, FirebaseMember> | null;

      const others: GroupMember[] = data
        ? Object.entries(data)
            .filter(([sid]) => sid !== sessionId)
            .filter(([, m]) => m.name)
            .map(([sid, m]) => ({
              id: sid,
              name: m.name,
              initials: m.initials,
              items: parseItems(m.itemsJson),
              isCurrentUser: false,
            }))
        : [];

      const prevOthers = prevOthersRef.current;

      // Fire toasts when another member adds items
      for (const other of others) {
        const prev = prevOthers.find(p => p.id === other.id);
        if (prev) {
          for (const item of other.items) {
            const prevQty = prev.items.find(i => i.id === item.id)?.quantity ?? 0;
            if (item.quantity > prevQty) {
              addToast({
                id: `${other.id}-${item.id}-${Date.now()}`,
                message: `${other.name} added ${item.name}`,
                success: true,
              });
            }
          }
        }
      }

      prevOthersRef.current = others;

      setState(s => {
        const me = s.groupMembers.find(m => m.isCurrentUser)!;

        let newJoiner = s.newJoiner;
        if (!newJoiner) {
          for (const other of others) {
            if (!prevOthers.find(p => p.id === other.id) && other.name) {
              newJoiner = { name: other.name, initials: other.initials };
              break;
            }
          }
        }

        return {
          ...s,
          groupMembers: [me, ...others],
          hasGroup: others.length > 0,
          newJoiner,
        };
      });
    });

    return () => unsub();
  }, [sessionId, addToast]);

  // ─── Firebase: listen to the orders timeline ────────────────────────────────
  // No forced navigation — placing an order surfaces the tracker pill instead.

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ordersListRef = ref(db, `tables/${TABLE_ID}/orders`);
    const unsub = onValue(ordersListRef, (snapshot) => {
      const orders = parseOrders(snapshot.val());
      setState(s => ({ ...s, orders }));
    });
    return () => unsub();
  }, []);

  // ─── Firebase: clear my local cart when the backend clears it (order placed) ──
  // The members listener ignores self, so this is how a placement made on another
  // device (which clears every cart server-side) reaches my own cart.

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const myItemsRef = ref(db, `tables/${TABLE_ID}/members/${sessionId}/itemsJson`);
    const unsub = onValue(myItemsRef, (snapshot) => {
      if (snapshot.val() !== '[]') return;
      setState(s => {
        const me = s.groupMembers.find(m => m.isCurrentUser);
        if (!me || me.items.length === 0) return s;
        return { ...s, groupMembers: s.groupMembers.map(m => m.isCurrentUser ? { ...m, items: [] } : m) };
      });
    });
    return () => unsub();
  }, [sessionId]);

  // ─── Firebase connection indicator ──────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const connRef = ref(db, '.info/connected');
    const unsub = onValue(connRef, (snap) => {
      setState(s => ({ ...s, firebaseConnected: snap.val() === true }));
    });
    return () => unsub();
  }, []);

  // ─── Sync current user's cart to Firebase ───────────────────────────────────

  const syncCartToFirebase = useCallback((items: CartItem[]) => {
    if (typeof window === 'undefined') return;
    update(ref(db, `tables/${TABLE_ID}/members/${sessionId}`), {
      itemsJson: JSON.stringify(items),
    }).catch(() => {});
  }, [sessionId]);

  // ─── Join table ─────────────────────────────────────────────────────────────

  const joinTable = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const initials = trimmed.substring(0, 2).toUpperCase();

    let currentItems: CartItem[] = [];
    setState(s => {
      const me = s.groupMembers.find(m => m.isCurrentUser);
      currentItems = me?.items || [];
      return {
        ...s,
        userName: trimmed,
        groupMembers: s.groupMembers.map(m =>
          m.isCurrentUser ? { ...m, name: trimmed, initials } : m
        ),
      };
    });

    const myRef = ref(db, `tables/${TABLE_ID}/members/${sessionId}`);
    await set(myRef, {
      id: sessionId,
      name: trimmed,
      initials,
      itemsJson: JSON.stringify(currentItems),
      joinedAt: Date.now(),
    });
    // Auto-remove this member when the browser disconnects
    onDisconnect(myRef).remove();
  }, [sessionId]);

  // ─── Reset order ────────────────────────────────────────────────────────────

  const resetOrder = useCallback(async () => {
    try { await api.resetTable(TABLE_ID); } catch {}
    try { await remove(ref(db, `tables/${TABLE_ID}/members/${sessionId}`)); } catch {}

    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('menuva-state'); } catch {}
    }

    toastTimeoutsRef.current.forEach(t => clearTimeout(t));
    toastTimeoutsRef.current.clear();
    toastsRef.current = [];
    setToasts([]);

    setState(s => ({
      screen: 'welcome',
      userName: '',
      hasGroup: false,
      groupMembers: [{ id: sessionId, name: '', initials: '', items: [], isCurrentUser: true }],
      selectedItem: null,
      toasts: [],
      newJoiner: null,
      orders: [],
      queueNotice: null,
      showPayment: false,
      itemQuantity: 1,
      itemExtras: [],
      selectedCategory: 'All',
      firebaseConnected: s.firebaseConnected,
    }));
  }, [sessionId]);

  // ─── Screen navigation ──────────────────────────────────────────────────────

  const setScreen = useCallback((screen: Screen) => setState(s => ({ ...s, screen })), []);

  const goBack = useCallback(() => {
    setState(s => {
      const map: Record<Screen, Screen> = {
        detail: 'menu', viewer3d: 'detail', order: 'menu',
        payment: 'waiting', menu: 'welcome', waiting: 'menu', welcome: 'welcome',
      };
      return { ...s, screen: map[s.screen] ?? 'menu' };
    });
  }, []);

  // ─── Simple state setters ───────────────────────────────────────────────────

  const setUserName = useCallback((userName: string) => setState(s => ({ ...s, userName })), []);
  const setHasGroup = useCallback((hasGroup: boolean) => setState(s => ({ ...s, hasGroup })), []);
  const selectItem = useCallback((selectedItem: MenuItem | null) => setState(s => ({
    ...s, selectedItem, itemQuantity: 1, itemExtras: [],
  })), []);
  const setItemQuantity = useCallback((itemQuantity: number) => setState(s => ({ ...s, itemQuantity })), []);
  const setSelectedCategory = useCallback((selectedCategory: string) => setState(s => ({ ...s, selectedCategory })), []);
  const placeOrder = useCallback(async (kitchenNotes?: string) => {
    const me = groupMembersRef.current.find(m => m.isCurrentUser);
    // Make sure the backend reads my latest cart before it snapshots the order.
    if (me) {
      try {
        await update(ref(db, `tables/${TABLE_ID}/members/${sessionId}`), {
          itemsJson: JSON.stringify(me.items),
        });
      } catch { /* ignore */ }
    }
    await api.placeOrder(TABLE_ID, kitchenNotes);
    // Backend cleared the RTDB carts; clear my local cart + any queue notice to match.
    setState(s => ({
      ...s,
      queueNotice: null,
      groupMembers: s.groupMembers.map(m => m.isCurrentUser ? { ...m, items: [] } : m),
    }));
  }, [sessionId]);

  const clearQueueNotice = useCallback(() => setState(s => ({ ...s, queueNotice: null })), []);
  const setShowPayment = useCallback((showPayment: boolean) => setState(s => ({ ...s, showPayment })), []);
  const addItemExtra = useCallback((extraId: string) => setState(s => ({
    ...s, itemExtras: s.itemExtras.includes(extraId) ? s.itemExtras : [...s.itemExtras, extraId],
  })), []);
  const removeItemExtra = useCallback((extraId: string) => setState(s => ({
    ...s, itemExtras: s.itemExtras.filter(e => e !== extraId),
  })), []);
  const clearNewJoiner = useCallback(() => setState(s => ({ ...s, newJoiner: null })), []);

  // ─── Cart ───────────────────────────────────────────────────────────────────

  const addToCart = useCallback((item: MenuItem, quantity: number, extras: string[]) => {
    const me = groupMembersRef.current.find(m => m.isCurrentUser);
    if (!me) return;

    const existingIdx = me.items.findIndex(
      i => i.id === item.id && JSON.stringify(i.extras) === JSON.stringify(extras)
    );
    const newItems: CartItem[] = existingIdx >= 0
      ? me.items.map((i, idx) => idx === existingIdx ? { ...i, quantity: i.quantity + quantity } : i)
      : [...me.items, { ...item, quantity, extras }];

    // 5-minute rule: if the last order was placed >5 min ago, adding now starts a
    // NEW order queue — surface that before they place.
    const orders = ordersRef.current;
    const latest = orders.length ? orders[orders.length - 1] : null;
    const startsNewQueue = !!latest && Date.now() - latest.placedAt > QUEUE_WINDOW_MS;

    // Side effects outside setState — won't double-fire under React Strict Mode
    addToast({ id: Date.now().toString(), message: `${me.name || 'You'} added ${item.name}`, success: true });
    syncCartToFirebase(newItems);
    setState(s => ({
      ...s,
      groupMembers: s.groupMembers.map(m => m.isCurrentUser ? { ...m, items: newItems } : m),
      queueNotice: startsNewQueue ? { round: latest!.round + 1 } : s.queueNotice,
    }));
  }, [addToast, syncCartToFirebase]);

  const removeFromCart = useCallback((itemId: string) => {
    const me = groupMembersRef.current.find(m => m.isCurrentUser);
    if (!me) return;
    const newItems = me.items.filter(i => i.id !== itemId);
    syncCartToFirebase(newItems);
    setState(s => ({
      ...s,
      groupMembers: s.groupMembers.map(m => m.isCurrentUser ? { ...m, items: newItems } : m),
    }));
  }, [syncCartToFirebase]);

  const decrementFromCart = useCallback((itemId: string) => {
    const me = groupMembersRef.current.find(m => m.isCurrentUser);
    if (!me) return;
    const target = me.items.find(i => i.id === itemId);
    if (!target) return;
    const newItems = target.quantity <= 1
      ? me.items.filter(i => i.id !== itemId)
      : me.items.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
    syncCartToFirebase(newItems);
    setState(s => ({
      ...s,
      groupMembers: s.groupMembers.map(m => m.isCurrentUser ? { ...m, items: newItems } : m),
    }));
  }, [syncCartToFirebase]);

  // getCartCount: all members combined so the badge syncs across devices
  const getCartCount = useCallback(() =>
    state.groupMembers.reduce(
      (total, m) => total + m.items.reduce((sum, i) => sum + i.quantity, 0),
      0
    ),
  [state.groupMembers]);

  // getCartTotal: all members combined (for the order summary total)
  const getCartTotal = useCallback(() =>
    state.groupMembers.reduce(
      (total, m) => total + m.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      0
    ),
  [state.groupMembers]);

  const showToast = useCallback((message: string, initials?: string, success?: boolean) => {
    addToast({ id: Date.now().toString(), message, initials, success });
  }, [addToast]);

  const dismissToast = useCallback((id: string) => {
    const t = toastTimeoutsRef.current.get(id);
    if (t) { clearTimeout(t); toastTimeoutsRef.current.delete(id); }
    toastsRef.current = toastsRef.current.filter(t => t.id !== id);
    setToasts([...toastsRef.current]);
  }, []);

  // ─── Persist current user to localStorage (debounced 500ms) ────────────────

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem('menuva-state', JSON.stringify({
          userName: state.userName,
        }));
      } catch {}
    }, 500);
  }, [state.userName]);

  useEffect(() => () => {
    toastTimeoutsRef.current.forEach(t => clearTimeout(t));
  }, []);

  const value: AppContextType = {
    ...state,
    toasts,
    sessionId,
    tableId: TABLE_ID,
    newJoiner: state.newJoiner,
    setScreen,
    setUserName,
    setHasGroup,
    selectItem,
    addToCart,
    removeFromCart,
    decrementFromCart,
    getCartTotal,
    getCartCount,
    showToast,
    dismissToast,
    placeOrder,
    clearQueueNotice,
    setShowPayment,
    setItemQuantity,
    addItemExtra,
    removeItemExtra,
    setSelectedCategory,
    clearNewJoiner,
    goBack,
    joinTable,
    resetOrder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
