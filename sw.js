// Versie komt uit index.html (APP_VERSION), via register('./sw.js?v=…').
// Dit bestand hoeft bij een release NIET aangepast te worden.
const VERSION = new URL(self.location).searchParams.get('v') || '0';
const CACHE = 'darts-v' + VERSION;
// Relatief aan de plek van sw.js, werkt dus op dartsbytom.com én op github.io/DartsByTom
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
// Externe scripts die de app nodig heeft: ook bewaren, zodat de app offline start
const EXTERNAL = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Elk bestand los: één mislukte download breekt de installatie niet meer
      return Promise.all(
        FILES.map(function(f) { return cache.add(f).catch(function() {}); }).concat(
        EXTERNAL.map(function(u) {
          return fetch(new Request(u, { mode: 'no-cors' })).then(function(r) { return cache.put(u, r); }).catch(function() {});
        }))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { if (k !== CACHE) return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // De app zelf: altijd eerst de nieuwste versie, offline de bewaarde
  if (req.mode === 'navigate' || (url.origin === self.location.origin && (url.pathname.endsWith('.html') || url.pathname.endsWith('/')))) {
    e.respondWith(
      fetch(req).then(function(res) {
        var copy = res.clone();
        caches.open(CACHE).then(function(c) { c.put(req, copy); });
        return res;
      }).catch(function() {
        return caches.match(req, { ignoreSearch: true }).then(function(r) {
          return r || caches.match('./index.html').then(function(r2) { return r2 || caches.match('./'); });
        });
      })
    );
    return;
  }

  // Firebase-scripts (vaste versie): uit de cache, anders downloaden en bewaren
  if (url.hostname === 'www.gstatic.com') {
    e.respondWith(
      caches.match(req).then(function(cached) {
        return cached || fetch(req).then(function(res) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c) { c.put(req, copy); });
          return res;
        });
      })
    );
    return;
  }

  // Overige bestanden van de eigen site (iconen, manifest): cache, anders netwerk
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req).then(function(cached) { return cached || fetch(req); }));
  }
  // Al het andere (Firestore, inloggen) gaat gewoon via het netwerk
});
