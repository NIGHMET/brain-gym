// 离线缓存：改代码后把版本号 +1 即可强制刷新
const CACHE = 'braingym-v1.3.0';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/core.js',
  'js/icons.js',
  'js/db.js',
  'js/audio.js',
  'js/games/corsi.js',
  'js/games/stroop.js',
  'js/games/flash.js',
  'js/games/math.js',
  'js/games/matrix.js',
  'js/games/match.js',
  'js/games/nback.js',
  'js/games/duel.js',
  'js/ui.js',
  'js/app.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true })
      .then(r => r || fetch(e.request))
  );
});
