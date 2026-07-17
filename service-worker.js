const CACHE = 'origen-cultural-v2-logo-oficial';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./data.js','./manifest.webmanifest','./assets/logo-mark.svg','./assets/logo-lockup.svg','./assets/images/embroidery.jpg','./assets/images/mural.jpg','./assets/images/territory.jpg','./assets/images/caves.jpg','./assets/images/chawar.jpg','./assets/images/gastronomy.jpg','./assets/images/dance.jpg','./assets/images/landscape.jpg'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
