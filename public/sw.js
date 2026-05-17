// Service Worker for Menuva PWA - Enhanced offline capability
const CACHE_NAME = 'menuva-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Install event - cache static assets with priority
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Take control immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - optimized caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome extensions and other origins
  if (url.origin !== location.origin) return;
  
  // Navigation requests - network first with cache fallback
  // This ensures fresh content but works offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful response
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          // Try cache on network failure
          return caches.match('/').then(cached => cached || new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable'
          }));
        })
    );
    return;
  }
  
  // Static assets - cache first with network update (stale-while-revalidate)
  // This is fastest for subsequent loads
  const isStaticAsset = 
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webp');
  
  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // Return cached immediately
          const networkFetch = fetch(request)
            .then((networkResponse) => {
              // Update cache in background
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse || null);
          
          return cachedResponse || networkFetch;
        });
      })
    );
    return;
  }
  
  // API requests - network only with cache fallback
  // This ensures fresh data but saves cache space
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Get orders from IndexedDB and sync when online
  console.log('Syncing offline orders...');
}

// Push notifications for order updates
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Your order is ready!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    tag: 'order-notification',
    renotify: true,
    data: { url: '/' }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Menuva', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.delete(CACHE_NAME);
  }
  
  // Handle cache version update
  if (event.data?.type === 'updateCache') {
    caches.open(CACHE_NAME).then(cache => {
      cache.addAll(event.data.urls || STATIC_ASSETS);
    });
  }
});