const CACHE_NAME = "wagamee-pwa-v2";
const STATIC_ASSETS = [
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./assets/wagamee-logo-new.png",
  "./assets/wagamee-bubble-wide.png",
  "./assets/room-dark-desktop.png",
  "./assets/room-dark-mobile.png",
  "./assets/outside-desktop.png",
  "./assets/outside-mobile.png",
  "./assets/devil-room-character.png",
  "./assets/devil-searching.png",
  "./assets/devil-found.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.includes("/assets/") || url.pathname.includes("/icons/") || url.pathname.endsWith("/manifest.webmanifest"));

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached || Response.error());
    })
  );
});
