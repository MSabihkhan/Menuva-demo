'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartItem, GroupMember, Toast, MenuItem } from '@/data/menu';

export type Screen = 'welcome' | 'menu' | 'detail' | 'viewer3d' | 'order' | 'waiting' | 'payment';

const MAX_TOASTS = 3;
const TOAST_DURATION = 3000;
const TABLE_ID = 'T7';
const POLL_INTERVAL = 3000;

interface AppState {
  screen: Screen;
  userName: string;
  hasGroup: boolean;
  groupMembers: GroupMember[];
  selectedItem: MenuItem | null;
  toasts: Toast[];
  newJoiner: { name: string; initials: string } | null;
  orderStatus: string;
  showPayment: boolean;
  itemQuantity: number;
  itemExtras: string[];
  selectedCategory: string;
}

interface AppContextType extends AppState {
  sessionId: string;
  tableId: string;
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
  setOrderStatus: (status: string) => void;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const sessionId = useRef(getOrCreateSessionId()).current;

  const toastsRef = useRef<Toast[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevOthersRef = useRef<GroupMember[]>([]);
  const toastTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { userName: savedName, currentUserItems: savedItems } = loadPersistedState();

  const [state, setState] = useState<AppState>({
    screen: 'welcome',
    userName: savedName,
    hasGroup: false,
    groupMembers: [{
      id: sessionId,
      name: savedName,
      initials: savedName ? savedName.substring(0, 2).toUpperCase() : '',
      items: savedItems,
      isCurrentUser: true,
    }],
    selectedItem: null,
    toasts: [],
    newJoiner: null,
    orderStatus: 'placed',
    showPayment: false,
    itemQuantity: 1,
    itemExtras: [],
    selectedCategory: 'All',
  });

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

  // ─── Server sync ────────────────────────────────────────────────────────────

  const syncCartToServer = useCallback((items: CartItem[]) => {
    if (typeof window === 'undefined') return;
    fetch(`/api/table/${TABLE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateCart', memberId: sessionId, items }),
    }).catch(() => {});
  }, [sessionId]);

  // One-time fetch on mount to populate other users at the table
  useEffect(() => {
    console.log('[APP] Fetching table data...');
    fetch(`/api/table/${TABLE_ID}`)
      .then(r => r.json())
      .then((data: { members: GroupMember[]; debug?: string }) => {
        console.log('[APP] Got members:', data.members.map(m => m.name), '| debug:', data.debug);
        const others = data.members.filter(m => m.id !== sessionId && m.name);
        if (others.length > 0) {
          setState(s => ({
            ...s,
            hasGroup: true,
            groupMembers: [
              ...s.groupMembers.filter(m => m.isCurrentUser),
              ...others.map(m => ({ ...m, isCurrentUser: false })),
            ],
          }));
        }
      })
      .catch((e) => console.log('[APP] Fetch error:', e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling — runs on all screens (detects joiners even from welcome)
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/table/${TABLE_ID}`);
        if (!res.ok) return;
        const data: { members: GroupMember[]; orderStatus: string } = await res.json();

        const others = data.members
          .filter(m => m.id !== sessionId && m.name)
          .map(m => ({ ...m, isCurrentUser: false }));

        const prevOthers = prevOthersRef.current;

        // Toast when any other member adds a new item
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
          const me = s.groupMembers.find(m => m.isCurrentUser);

          // Detect first new joiner not yet shown
          let newJoiner = s.newJoiner;
          if (!newJoiner) {
            for (const other of others) {
              if (!prevOthers.find(p => p.id === other.id)) {
                newJoiner = { name: other.name, initials: other.initials };
                break;
              }
            }
          }

          return {
            ...s,
            groupMembers: me ? [me, ...others] : others,
            hasGroup: others.length > 0,
            orderStatus: data.orderStatus || s.orderStatus,
            newJoiner,
          };
        });
      } catch { /* ignore network errors */ }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [sessionId, addToast]);

  // ─── Join / reset ───────────────────────────────────────────────────────────

  const joinTable = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const member: GroupMember = {
      id: sessionId,
      name: trimmed,
      initials: trimmed.substring(0, 2).toUpperCase(),
      items: [],
      isCurrentUser: true,
    };

    setState(s => ({
      ...s,
      userName: trimmed,
      groupMembers: s.groupMembers.map(m =>
        m.isCurrentUser ? member : m
      ),
    }));

    // BroadcastChannel for same-device tabs
    try {
      const bc = new BroadcastChannel('menuva_table');
      bc.postMessage({ type: 'JOIN', name: trimmed, id: sessionId });
      bc.close();
    } catch { /* ignore */ }

    // Server
    try {
      await fetch(`/api/table/${TABLE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', member }),
      });
    } catch { /* continue offline */ }
  }, [sessionId]);

  const resetOrder = useCallback(async () => {
    // Remove from server table
    try {
      await fetch(`/api/table/${TABLE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', memberId: sessionId }),
      });
    } catch { /* ignore */ }

    // Clear persisted state
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('menuva-state'); } catch { /* ignore */ }
    }

    // Clear all toast timers
    toastTimeoutsRef.current.forEach(t => clearTimeout(t));
    toastTimeoutsRef.current.clear();
    toastsRef.current = [];
    setToasts([]);

    // Reset to initial
    setState({
      screen: 'welcome',
      userName: '',
      hasGroup: false,
      groupMembers: [{ id: sessionId, name: '', initials: '', items: [], isCurrentUser: true }],
      selectedItem: null,
      toasts: [],
      newJoiner: null,
      orderStatus: 'placed',
      showPayment: false,
      itemQuantity: 1,
      itemExtras: [],
      selectedCategory: 'All',
    });
  }, [sessionId]);

  // ─── BroadcastChannel (same-device) ────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel('menuva_table');
    bc.onmessage = (event) => {
      if (event.data.type === 'JOIN' && event.data.id !== sessionId) {
        setState(s => {
          if (s.groupMembers.find(m => m.id === event.data.id)) return s;
          return {
            ...s,
            hasGroup: true,
            groupMembers: [...s.groupMembers, {
              id: event.data.id,
              name: event.data.name,
              initials: event.data.name.substring(0, 2).toUpperCase(),
              items: [],
              isCurrentUser: false,
            }],
          };
        });
      }
    };
    return () => bc.close();
  }, [sessionId]);

  // ─── Screen navigation ──────────────────────────────────────────────────────

  const setScreen = useCallback((screen: Screen) => setState(s => ({ ...s, screen })), []);

  const goBack = useCallback(() => {
    setState(s => {
      const map: Record<Screen, Screen> = {
        detail: 'menu',
        viewer3d: 'detail',
        order: 'menu',
        payment: 'waiting',
        menu: 'welcome',
        waiting: 'menu',
        welcome: 'welcome',
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
  const setOrderStatus = useCallback((orderStatus: string) => setState(s => ({ ...s, orderStatus })), []);
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
    setState(s => {
      const me = s.groupMembers.find(m => m.isCurrentUser);
      if (!me) return s;

      const existingIdx = me.items.findIndex(
        i => i.id === item.id && JSON.stringify(i.extras) === JSON.stringify(extras)
      );

      let newItems: CartItem[];
      if (existingIdx >= 0) {
        newItems = me.items.map((i, idx) =>
          idx === existingIdx ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        newItems = [...me.items, { ...item, quantity, extras }];
      }

      addToast({ id: Date.now().toString(), message: `${me.name || 'You'} added ${item.name}`, success: true });
      syncCartToServer(newItems);

      return {
        ...s,
        groupMembers: s.groupMembers.map(m => m.isCurrentUser ? { ...m, items: newItems } : m),
      };
    });
  }, [addToast, syncCartToServer]);

  const removeFromCart = useCallback((itemId: string) => {
    setState(s => {
      const newMembers = s.groupMembers.map(m =>
        m.isCurrentUser ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m
      );
      const me = newMembers.find(m => m.isCurrentUser);
      if (me) syncCartToServer(me.items);
      return { ...s, groupMembers: newMembers };
    });
  }, [syncCartToServer]);

  const decrementFromCart = useCallback((itemId: string) => {
    setState(s => {
      const newMembers = s.groupMembers.map(m => {
        if (!m.isCurrentUser) return m;
        const item = m.items.find(i => i.id === itemId);
        if (!item) return m;
        const newItems = item.quantity <= 1
          ? m.items.filter(i => i.id !== itemId)
          : m.items.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
        return { ...m, items: newItems };
      });
      const me = newMembers.find(m => m.isCurrentUser);
      if (me) syncCartToServer(me.items);
      return { ...s, groupMembers: newMembers };
    });
  }, [syncCartToServer]);

  const getCurrentUser = useCallback(() =>
    state.groupMembers.find(m => m.isCurrentUser), [state.groupMembers]);

  const getCartCount = useCallback(() => {
    const u = getCurrentUser();
    return u ? u.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  }, [getCurrentUser]);

  const getCartTotal = useCallback(() => {
    const u = getCurrentUser();
    return u ? u.items.reduce((sum, i) => sum + i.price * i.quantity, 0) : 0;
  }, [getCurrentUser]);

  const showToast = useCallback((message: string, initials?: string, success?: boolean) => {
    addToast({ id: Date.now().toString(), message, initials, success });
  }, [addToast]);

  const dismissToast = useCallback((id: string) => {
    const t = toastTimeoutsRef.current.get(id);
    if (t) { clearTimeout(t); toastTimeoutsRef.current.delete(id); }
    toastsRef.current = toastsRef.current.filter(t => t.id !== id);
    setToasts([...toastsRef.current]);
  }, []);

  // ─── Persist current user to localStorage ──────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('menuva-state', JSON.stringify({
        userName: state.userName,
        groupMembers: state.groupMembers,
      }));
    } catch { /* ignore */ }
  }, [state.userName, state.groupMembers]);

  // Cleanup toasts on unmount
  useEffect(() => () => {
    toastTimeoutsRef.current.forEach(t => clearTimeout(t));
  }, []);

  // Cleanup: remove user from table on tab close
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleBeforeUnload = () => {
      navigator.sendBeacon(`/api/table/${TABLE_ID}`, JSON.stringify({ action: 'leave', memberId: sessionId }));
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId]);

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
    setOrderStatus,
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
