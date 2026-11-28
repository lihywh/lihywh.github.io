const prefix = 'paperfold-offline-';
const cacheName = prefix + '00d409e21c81';
const files = ["app.js", "beginner.js", "courses.js", "fold-guide.js", "icon-192.png", "icon-512.png", "index.html", "manifest.webmanifest", "paper.js", "shadow.js", "software-renderer.js", "studio-courses.js", "studio-paper.js", "style.css", "thumb-bookmark.png", "thumb-bridge.png", "thumb-cup.png", "thumb-dart.png", "thumb-dog.png", "thumb-envelope.png", "thumb-frame.png", "thumb-hat.png", "thumb-heart.png", "thumb-house.png", "thumb-leaf.png", "thumb-penguin.png", "thumb-pinwheel.png", "thumb-rabbit.png", "thumb-rocket.png", "thumb-sailboat.png", "thumb-shield.png", "thumb-tent.png", "thumb-tulip.png", "thumb-whale.png", "vendor/THREE-LICENSE.txt", "vendor/three.core.min.js", "vendor/three.module.min.js"];
self.addEventListener('install', event => event.waitUntil(caches.open(cacheName).then(cache =>
  cache.addAll(files.map(path => new Request(path, {cache:'reload'}))))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith(prefix) && name !== cacheName) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const key = event.request.mode === 'navigate' ? new URL('index.html', self.registration.scope).href : event.request;
    return (await cache.match(key)) || fetch(event.request);
  })());
});
