const CACHE = 'origen-cultural-v8';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./data.js','./trust.js','./mundo.js',
  './manifest.webmanifest','./assets/logo-mark.svg','./assets/logo-lockup.svg',
  './assets/images/embroidery.jpg','./assets/images/mural.jpg','./assets/images/territory.jpg',
  './assets/images/caves.jpg','./assets/images/chawar.jpg','./assets/images/gastronomy.jpg',
  './assets/images/dance.jpg','./assets/images/landscape.jpg'
];

function isStaticAsset(url) {
  return /\.(?:html|js|css|webmanifest|svg|png|jpe?g|webp|gif|ico|woff2?)$/i.test(url.pathname);
}

// Never cache authentication transport code or runtime configuration.
// Offline is safer than serving an obsolete backend URL/key to a returning user.
function isSensitiveRuntime(url) {
  return /\/(?:supabase-client|runtime-config)\.js$/i.test(url.pathname);
}

function canCache(response) {
  if (!response || !response.ok || response.type !== 'basic') return false;
  const cacheControl = response.headers.get('cache-control') || '';
  return !/\b(?:no-store|private)\b/i.test(cacheControl);
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('origen-cultural-v') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never intercept Supabase/CDN/third-party traffic or authenticated requests.
  if (url.origin !== self.location.origin || req.headers.has('authorization')) return;

  // Cache API is intentionally bypassed, even when the network is offline.
  // This rule comes BEFORE the generic .js network-first fallback.
  if (isSensitiveRuntime(url)) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  const isNavigation = req.mode === 'navigate';
  const isCode = /\.(?:html|js|css)$/i.test(url.pathname);
  const isStatic = isStaticAsset(url);

  // Never cache arbitrary same-origin endpoints that may be added later.
  if (!isNavigation && !isStatic) return;

  if (isNavigation || isCode) {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (canCache(response)) {
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, response.clone())));
          }
          return response;
        })
        .catch(() => caches.match(req).then(cached => cached || (isNavigation ? caches.match('./index.html') : undefined)))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (canCache(response)) {
          event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, response.clone())));
        }
        return response;
      });
    })
  );
});
