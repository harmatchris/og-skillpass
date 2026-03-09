// OG Skills-Pass Service Worker
// Caches the app shell for offline use

const CACHE_NAME = 'og-skillspass-v1';

// Resources to cache immediately on install
const PRECACHE_URLS = [
  './skillspass-aufgaben.html',
  './manifest.json',
];

// External resources to cache when first fetched
const EXTERNAL_CACHE_PATTERNS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
];

// Firebase must stay network-first (real-time data)
const NETWORK_ONLY_PATTERNS = [
  'firebaseio.com',
  'firebase.googleapis.com',
  'gstatic.com/firebasejs',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase → always network (never cache)
  if (NETWORK_ONLY_PATTERNS.some(p => url.includes(p))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Fonts & CDN libs → cache-first, fallback to network
  if (EXTERNAL_CACHE_PATTERNS.some(p => url.includes(p))) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // App shell → network-first with cache fallback (keeps app up-to-date)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
