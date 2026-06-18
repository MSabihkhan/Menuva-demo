// Kill-switch service worker.
//
// The previous cache-first worker served stale bundles after every deploy,
// which is a liability for a live demo (offline support isn't needed here).
// This worker installs, deletes ALL caches, unregisters itself, and reloads
// any open windows — so every visitor is force-healed onto the latest build.
// It has NO fetch handler, so it never serves cached content.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* ignore */ }

    try {
      await self.registration.unregister();
    } catch (e) { /* ignore */ }

    // Force every controlled tab to reload fresh from the network.
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { client.navigate(client.url); } catch (e) { /* ignore */ }
    }
  })());
});
