const CACHE = 'origen-cultural-v5';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./supabase-client.js','./data.js','./mundo.js',
  './manifest.webmanifest','./assets/logo-mark.svg','./assets/logo-lockup.svg',
  './assets/images/embroidery.jpg','./assets/images/mural.jpg','./assets/images/territory.jpg',
  './assets/images/caves.jpg','./assets/images/chawar.jpg','./assets/images/gastronomy.jpg',
  './assets/images/dance.jpg','./assets/images/landscape.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isFreshCode = isSameOrigin && (
    req.mode === 'navigate' ||
    /\.(?:html|js|css)$/.test(url.pathname)
  );

  if (isFreshCode) {
    event.respondWith(
      fetch(req)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
          return response;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
