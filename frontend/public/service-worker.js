// Cleanup-only service worker.
// Existing clients may still have an old worker registered with stale cached HTML/JS.
// Publish this no-op worker so the browser updates it, clears all caches, and unregisters.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    await self.registration.unregister();

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((client) => {
      client.navigate(client.url);
    });
  })());
});
