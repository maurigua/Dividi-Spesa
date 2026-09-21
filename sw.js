// Service Worker di "Divide la Spesa"
// Serve solo a mettere in cache la pagina la prima volta che viene aperta online,
// così le volte successive (anche offline) l'app si apre comunque.
// Deve stare in un file a parte per requisito del browser: i Service Worker
// non possono essere registrati da un blob:/data: URI, solo da un file reale
// sulla stessa origine del sito.

const CACHE_NAME = 'divide-spesa-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // se un percorso non esiste va bene lo stesso, non blocca l'installazione
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Strategia: prova la rete, se fallisce (offline) usa la cache; aggiorna sempre la cache quando la rete funziona.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
