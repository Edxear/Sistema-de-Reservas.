// Service Worker - Cache-first strategy for static assets, Network-first for API

const CACHE_NAME = 'reservas-medicas-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Assets to cache on install (static resources)
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip requests to different origins
  if (url.origin !== location.origin) {
    return;
  }

  // API calls: Network-first (try network, fallback to cache)
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(networkFirst(request));
  }

  // Static assets: Cache-first (use cache, fallback to network)
  event.respondWith(cacheFirst(request));
});

// Cache-first strategy: use cache, fallback to network
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Fetch failed; returning offline page.', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cached = await cache.match('/');
      if (cached) {
        return cached;
      }
    }
    
    // Return a basic offline response
    return new Response('Offline - Resource unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Network-first strategy: try network, fallback to cache
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Network request failed; trying cache.', error);
    
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // Return offline response for API calls
    return new Response(
      JSON.stringify({ error: 'Request failed and no cached response available' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');
