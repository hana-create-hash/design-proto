const CACHE_NAME = "wagamee-pwa-v1";
const APP_SHELL = [
  "./",
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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
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

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./"));
    })
  );
});
