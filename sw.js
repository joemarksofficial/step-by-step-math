// Makes the app work offline. Online, it fetches the newest files so updates
// arrive without any version bump. Offline or on a slow connection, it falls
// back to the saved copy.
const CACHE = 'step-math';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'js/app.js',
  'js/expr.js',
  'js/graph.js',
  'js/lessons.js',
  'js/store.js',
  'js/unit-height.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];
const NETWORK_WAIT_MS = 2500;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(respond(event));
});

async function respond(event) {
  const { request } = event;
  const cache = await caches.open(CACHE);
  const network = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(request, response.clone());
    return response;
  });
  // Keep the service worker alive so the refresh can finish in the background.
  event.waitUntil(network.catch(() => {}));

  const saved = (await cache.match(request)) || (request.mode === 'navigate' ? await cache.match('./') : undefined);
  if (!saved) return network;

  const timeout = new Promise((resolve) => setTimeout(() => resolve(saved), NETWORK_WAIT_MS));
  return Promise.race([network.catch(() => saved), timeout]);
}
