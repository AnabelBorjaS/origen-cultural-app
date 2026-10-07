const CACHE = 'origen-cultural-v7';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=20261007-2',
  './app.js?v=20261007-2',
  './mundo.js?v=20261007-2',
  './data.js',
  './backend-runtime.js?v=20261007-1',
  './manifest.webmanifest',
  './assets/logo-mark.svg',
  './assets/logo-lockup.svg',
  './assets/images/embroidery.jpg',
  './assets/images/mural.jpg',
  './assets/images/territory.jpg',
  './assets/images/caves.jpg',
  './assets/images/chawar.jpg',
  './assets/images/gastronomy.jpg',
  './assets/images/dance.jpg',
  './assets/images/landscape.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
