'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, memo } from 'react';
import { CartItem, GroupMember, Toast, MENU_ITEMS, MenuItem } from '@/data/menu';

type Screen = 'welcome' | 'menu' | 'detail' | 'viewer3d' | 'order' | 'waiting' | 'payment';

// Maximum toasts to prevent memory accumulation
const MAX_TOASTS = 3;
const TOAST_DURATION = 3000;

interface AppState {
  screen: Screen;
  userName: string;
  hasGroup: boolean;
  groupMembers: GroupMember[];
  selectedItem: MenuItem | null;
  toasts: Toast[];
  orderStatus: string;
  showPayment: boolean;
  itemQuantity: number;
  itemExtras: string[];
  selectedCategory: string;
}

interface AppContextType extends AppState {
  setScreen: (s: Screen) => void;
  setUserName: (name: string) => void;
  setHasGroup: (has: boolean) => void;
  selectItem: (item: MenuItem | null) => void;
  addToCart: (item: MenuItem, quantity: number, extras: string[]) => void;
  removeFromCart: (itemId: string) => void;
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
  goBack: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Helper functions for cart calculations (using React.useMemo in components)
// These are simple pure functions, no need for memoization at this level

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Use refs for toasts to avoid stale closures and memory leaks
  const toastsRef = useRef<Toast[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Load persisted state from localStorage
  const loadPersistedState = (): Partial<AppState> => {
    if (typeof window === 'undefined') return {};
    try {
      const persisted = localStorage.getItem('menuva-state');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        return {
          userName: parsed.userName || '',
          hasGroup: parsed.hasGroup || false,
          groupMembers: parsed.groupMembers || [
            { id: '1', name: 'Sarah', initials: 'SA', items: [], isCurrentUser: true },
          ],
        };
      }
    } catch (e) {
      // Ignore parse errors
    }
    return {};
  };

  const initialPersisted = loadPersistedState();

  const [state, setState] = useState<AppState>({
    screen: 'welcome',
    userName: initialPersisted.userName || '',
    hasGroup: initialPersisted.hasGroup || false,
    groupMembers: initialPersisted.groupMembers || [
      { id: '1', name: 'Me', initials: 'ME', items: [], isCurrentUser: true },
    ],
    selectedItem: null,
    toasts: [],
    orderStatus: 'placed',
    showPayment: false,
    itemQuantity: 1,
    itemExtras: [],
    selectedCategory: 'All',
  });

  const getCurrentUser = useCallback(() => state.groupMembers.find(m => m.isCurrentUser), [state.groupMembers]);

  const setScreen = useCallback((screen: Screen) => setState(s => ({ ...s, screen })), []);
  
  const setUserName = useCallback((userName: string) => {
    setState(s => {
      // Broadcast that someone joined
      if (typeof window !== 'undefined' && userName) {
        try {
          const bc = new BroadcastChannel('menuva_table');
          bc.postMessage({ type: 'JOIN', name: userName, time: Date.now() });
        } catch (e) {}
      }
      return { ...s, userName };
    });
  }, []);
  
  const setHasGroup = useCallback((hasGroup: boolean) => setState(s => ({ ...s, hasGroup })), []);

  // Listen for other users joining
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel('menuva_table');
    bc.onmessage = (event) => {
      if (event.data.type === 'JOIN' && event.data.name !== state.userName) {
        // Check if member already exists to avoid duplicates
        const existingMember = state.groupMembers.find(m => m.id === event.data.name);
        if (!existingMember) {
          setState(s => ({
            ...s,
            hasGroup: true,
            groupMembers: [...s.groupMembers, { id: event.data.name, name: event.data.name, initials: event.data.name.substring(0,2).toUpperCase(), items: [] }]
          }));
        }
      }
    };
    return () => bc.close();
  }, [state.userName]);
  
  const selectItem = useCallback((selectedItem: MenuItem | null) => setState(s => ({ 
    ...s, 
    selectedItem, 
    itemQuantity: 1, 
    itemExtras: [] 
  })), []);
  const setItemQuantity = useCallback((itemQuantity: number) => setState(s => ({ ...s, itemQuantity })), []);
  const setSelectedCategory = useCallback((selectedCategory: string) => setState(s => ({ ...s, selectedCategory })), []);
  const setOrderStatus = useCallback((orderStatus: string) => setState(s => ({ ...s, orderStatus })), []);
  const setShowPayment = useCallback((showPayment: boolean) => setState(s => ({ ...s, showPayment })), []);

  const addItemExtra = useCallback((extraId: string) => {
    setState(s => ({
      ...s,
      itemExtras: s.itemExtras.includes(extraId) 
        ? s.itemExtras 
        : [...s.itemExtras, extraId]
    }));
  }, []);

  const removeItemExtra = useCallback((extraId: string) => {
    setState(s => ({
      ...s,
      itemExtras: s.itemExtras.filter(e => e !== extraId)
    }));
  }, []);

  const addToCart = useCallback((item: MenuItem, quantity: number, extras: string[]) => {
    const newItem: CartItem = { ...item, quantity, extras };
    setState(s => {
      const user = s.groupMembers.find(m => m.isCurrentUser);
      if (!user) return s;
      const userName = user.name;
      const existingIdx = user.items.findIndex(i => i.id === item.id && JSON.stringify(i.extras) === JSON.stringify(extras));
      let newItems: CartItem[];
      if (existingIdx >= 0) {
        newItems = [...user.items];
        newItems[existingIdx] = { ...newItems[existingIdx], quantity: newItems[existingIdx].quantity + quantity };
      } else {
        newItems = [...user.items, newItem];
      }
      
      // Limit toasts to prevent memory bloat - remove oldest if at limit
      if (toastsRef.current.length >= MAX_TOASTS) {
        const oldestId = toastsRef.current[0].id;
        const oldTimeout = toastTimeoutsRef.current.get(oldestId);
        if (oldTimeout) {
          clearTimeout(oldTimeout);
          toastTimeoutsRef.current.delete(oldestId);
        }
        toastsRef.current = toastsRef.current.slice(1);
      }
      
      // Show toast using ref to avoid re-renders
      const toastId = Date.now().toString();
      const newToast: Toast = { id: toastId, message: `${userName} added ${item.name}`, success: true };
      toastsRef.current = [...toastsRef.current, newToast];
      setToasts([...toastsRef.current]);
      
      // Auto-dismiss toast after 3 seconds
      const timeoutId = setTimeout(() => {
        toastsRef.current = toastsRef.current.filter(t => t.id !== toastId);
        setToasts([...toastsRef.current]);
        toastTimeoutsRef.current.delete(toastId);
      }, TOAST_DURATION);
      toastTimeoutsRef.current.set(toastId, timeoutId);
      
      return {
        ...s,
        groupMembers: s.groupMembers.map(m => m.isCurrentUser ? { ...m, items: newItems } : m)
      };
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setState(s => ({
      ...s,
      groupMembers: s.groupMembers.map(m => m.isCurrentUser 
        ? { ...m, items: m.items.filter(i => i.id !== itemId) }
        : m
      )
    }));
  }, []);

  const getCartCount = useCallback(() => {
    const user = getCurrentUser();
    // Use simple reduce instead of memoize
    return user ? user.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  }, [getCurrentUser]);

  const getCartTotal = useCallback(() => {
    const user = getCurrentUser();
    // Use simple reduce instead of memoize
    return user ? user.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) : 0;
  }, [getCurrentUser]);

  const showToast = useCallback((message: string, initials?: string, success?: boolean) => {
    // Limit toasts to prevent memory bloat - remove oldest if at limit
    if (toastsRef.current.length >= MAX_TOASTS) {
      const oldestId = toastsRef.current[0].id;
      const oldTimeout = toastTimeoutsRef.current.get(oldestId);
      if (oldTimeout) {
        clearTimeout(oldTimeout);
        toastTimeoutsRef.current.delete(oldestId);
      }
      toastsRef.current = toastsRef.current.slice(1);
    }
    
    const id = Date.now().toString();
    const newToast: Toast = { id, message, initials, success };
    toastsRef.current = [...toastsRef.current, newToast];
    setToasts([...toastsRef.current]);
    
    // Auto-dismiss with cleanup
    const timeoutId = setTimeout(() => {
      toastsRef.current = toastsRef.current.filter(t => t.id !== id);
      setToasts([...toastsRef.current]);
      toastTimeoutsRef.current.delete(id);
    }, TOAST_DURATION);
    toastTimeoutsRef.current.set(id, timeoutId);
  }, []);

  const dismissToast = useCallback((id: string) => {
    // Clear timeout if exists
    const timeout = toastTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeoutsRef.current.delete(id);
    }
    // Remove toast
    toastsRef.current = toastsRef.current.filter(t => t.id !== id);
    setToasts([...toastsRef.current]);
  }, []);

  const goBack = useCallback(() => {
    const screenMap: Record<Screen, Screen> = {
      'detail': 'menu',
      'viewer3d': 'detail',
      'order': 'menu',
      'payment': 'order',
      'menu': 'welcome',
      'waiting': 'menu',
      'welcome': 'welcome',
    };
    setScreen(screenMap[state.screen] || 'menu');
  }, [state.screen, setScreen]);

  useEffect(() => {
    if (state.userName && state.screen === 'welcome') {
      const name = state.userName.trim();
      if (name.length > 0) {
        setState(s => ({
          ...s,
          groupMembers: s.groupMembers.map(m => m.isCurrentUser 
            ? { ...m, name, initials: name.substring(0, 2).toUpperCase() }
            : m
          )
        }));
      }
    }
  }, [state.userName, state.screen]);

  // Persist cart and user to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const toPersist = {
        userName: state.userName,
        hasGroup: state.hasGroup,
        groupMembers: state.groupMembers.map(m => ({
          id: m.id,
          name: m.name,
          initials: m.initials,
          items: m.items,
          isCurrentUser: m.isCurrentUser,
        })),
      };
      localStorage.setItem('menuva-state', JSON.stringify(toPersist));
    } catch (e) {
      // Ignore storage errors
    }
  }, [state.userName, state.hasGroup, state.groupMembers]);

  // Cleanup toasts on unmount
  useEffect(() => {
    return () => {
      // Clear all toast timeouts
      toastTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      toastTimeoutsRef.current.clear();
      toastsRef.current = [];
    };
  }, []);

  // Sync ref with state for toasts
  const toastsState = {
    ...state,
    toasts,
  };

  return (
    <AppContext.Provider value={{
      ...toastsState,
      setScreen,
      setUserName,
      setHasGroup,
      selectItem,
      addToCart,
      removeFromCart,
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
      goBack,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}