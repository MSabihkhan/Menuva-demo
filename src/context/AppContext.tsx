'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, GroupMember, Toast, MENU_ITEMS, MenuItem } from '@/data/menu';

type Screen = 'welcome' | 'menu' | 'detail' | 'viewer3d' | 'order' | 'waiting' | 'payment';

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

export function AppProvider({ children }: { children: React.ReactNode }) {
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

  const getInitialials = (name: string) => name ? name.substring(0, 2).toUpperCase() : 'ME';

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
      setTimeout(() => showToast(`${userName} added ${item.name} · PKR ${item.price}`), 0);
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
    return getCurrentUser()?.items.reduce((sum, i) => sum + i.quantity, 0) || 0;
  }, [getCurrentUser]);

  const getCartTotal = useCallback(() => {
    return getCurrentUser()?.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0;
  }, [getCurrentUser]);

  const showToast = useCallback((message: string, initials?: string, success?: boolean) => {
    const id = Date.now().toString();
    setState(s => ({
      ...s,
      toasts: [...s.toasts, { id, message, initials, success }]
    }));
    setTimeout(() => {
      setState(s => ({
        ...s,
        toasts: s.toasts.filter(t => t.id !== id)
      }));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setState(s => ({
      ...s,
      toasts: s.toasts.filter(t => t.id !== id)
    }));
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

  return (
    <AppContext.Provider value={{
      ...state,
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