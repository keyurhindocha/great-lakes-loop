// Great Lakes Loop — offline app shell
// Strategy: cache-first. The whole app is one self-contained HTML file with
// no external calls, so once this list is cached, the page loads and runs
// with zero network — no wifi, no cell signal, nothing.
const CACHE = "gll-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(res => {
          // Keep the cached copy fresh whenever a connection is available.
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached); // offline: fall back to cache
      return cached || network;
    })
  );
});
