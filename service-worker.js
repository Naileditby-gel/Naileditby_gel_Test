const CACHE_NAME = 'naileditby-gel-app-shell-v2';
const APP_SHELL = [
  '/app',
  '/app-shell.css',
  '/app-nav.css',
  '/app-shell.js',
  '/manifest.json',
  '/app-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('naileditby-gel-app-shell-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache booking pages, customer data, payment receipts, API calls or uploads.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!APP_SHELL.includes(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => cache.match(request)).then(cached => cached || fetch(request))
  );
});