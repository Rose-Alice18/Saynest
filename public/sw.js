// SayNest service worker: lets the installed app open without a connection.
//
// - Pages: try the network first (so a new version shows up straight away),
//   fall back to the saved copy when offline.
// - Built files (/assets/*, icons, fonts): saved the first time they load and
//   served from the saved copy after that. Their names change with each
//   release, so old copies are never shown by mistake.
// - Never saved: AI lookups (/api/*), sign-in pages (/__/*), and requests to
//   Firebase or other sites. Words themselves are kept by the app and Firestore.
const CACHE = 'saynest-v1';
const APP_SHELL = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isFont = (url) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameSite = url.origin === self.location.origin;

  if (!sameSite && !isFont(url)) return; // Firebase, Google sign-in, dictionary audio, etc.
  if (sameSite && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/'))) return;

  // Pages: network first, saved copy when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          if (response.ok) caches.open(CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Files and fonts: saved copy first, otherwise fetch and save
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok || response.type === 'opaque') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
