'use client';

import { useEffect, useCallback, useState } from 'react';

// PWA registration and management hook
export function usePWA() {
  const registerSW = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content available, refresh to update');
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  const unregisterSW = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('Service Worker unregistered');
    } catch (error) {
      console.error('Service Worker unregister failed:', error);
    }
  }, []);

  const clearCache = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }, []);

  // Service worker is intentionally NOT registered — the old cache-first worker
  // served stale builds. Actively unregister any previously-installed worker and
  // clear its caches so visitors always get the latest deploy. (The /sw.js
  // kill-switch heals tabs that still have the old worker controlling them.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    void unregisterSW();
    void clearCache();
  }, [unregisterSW, clearCache]);

  return {
    registerSW,
    unregisterSW,
    clearCache,
  };
}

// Hook to check if app is running offline
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOnline, setWasOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track when connection status changes
  useEffect(() => {
    if (!isOnline && wasOnline) {
      console.log('App is now offline');
    }
    if (isOnline && !wasOnline) {
      console.log('App is back online');
    }
    setWasOnline(isOnline);
  }, [isOnline, wasOnline]);

  return { isOnline, wasOnline };
}