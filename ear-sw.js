/* Ear, offline. Keeps a copy of Ear's own files and serves them when there
   is no connection; with a connection it always fetches the newest version
   first, so an update you upload shows straight away. Every other file on
   the site is left completely alone. */
const CACHE = 'ear-v1';
const FILES = ['ear.html', 'ear.webmanifest', 'ear-180.png', 'ear-192.png', 'ear-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('ear-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const name = url.pathname.split('/').pop();
  if (!FILES.includes(name)) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(name, copy)); }
        return res;
      })
      .catch(() => caches.match(name).then(hit => hit || caches.match(req)))
  );
});
