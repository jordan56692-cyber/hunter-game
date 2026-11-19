// offline cache for Hunter (bump VERSION to force an update)
const VERSION = 'hunter-1795123840814';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './gotango.glb', './scarlet.glb', './sarah.glb'];
// cache:'reload' makes sure we store the fresh files, never an old copy the browser was holding on to
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // the game page itself: always try the internet first (so updates show up straight away), fall back to the saved copy offline
  if (e.request.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname)) {
    e.respondWith(fetch(new Request(u.origin + u.pathname, { cache: 'no-store', credentials: 'same-origin' })).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put('./index.html', cp)); } return r; })
      .catch(() => caches.match('./index.html', { ignoreSearch: true })));
    return;
  }
  // models and icons: saved copy first (they're big and rarely change)
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).catch(() => caches.match('./index.html'))));
});
