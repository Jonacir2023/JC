const CACHE='buildly-v2-fc-2.2';
const ASSETS=['./','./index.html','./styles.css','./data.js','./app.js','./manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
