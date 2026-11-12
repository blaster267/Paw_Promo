// Keeps Paw Promo working offline once it has been opened.
// Bump VERSION whenever files change so phones pick up the update.
const VERSION = 'paw-promo-v5';
const FILES = [
  './', 'index.html', 'app.css', 'fonts.css', 'manifest.webmanifest',
  'js/app.js', 'js/draw.js', 'js/templates/index.js',
  'js/templates/dating.js', 'js/templates/card.js', 'js/templates/poster.js',
  'js/templates/wanted.js', 'js/templates/magazine.js', 'js/templates/comic.js',
  'js/templates/employee.js', 'js/templates/royal.js', 'js/templates/player.js', 'js/vendor/qrcode.js',
  'fonts/Fredoka.woff2', 'fonts/BebasNeue.woff2', 'fonts/LilitaOne.woff2',
  'fonts/Oswald.woff2', 'fonts/PlayfairDisplay-italic.woff2', 'fonts/PlayfairDisplay-700.woff2',
  'fonts/Rye.woff2', 'fonts/AbrilFatface.woff2', 'fonts/Bangers.woff2', 'fonts/Cinzel.woff2',
  'fonts/GreatVibes.woff2', 'fonts/PressStart2P.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network first (so updates show up), falling back to the cache when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
