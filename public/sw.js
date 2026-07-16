importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

const CACHE_NAME = "wagamee-pwa-v2";
const firebaseConfig = {
  apiKey: "AIzaSyCGAfHdsBIJWZzaWBlvYu4hGUamPgS854I",
  authDomain: "designe-hana.firebaseapp.com",
  projectId: "designe-hana",
  storageBucket: "designe-hana.firebasestorage.app",
  messagingSenderId: "851897207048",
  appId: "1:851897207048:web:5cbd5b01b8f59c4f79c4bd"
};
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

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "WagaMee";
  const options = {
    body: payload.notification?.body || "小悪魔が呼んでいます。",
    icon: "./icons/icon.svg",
    badge: "./icons/icon.svg",
    data: payload.data || {}
  };

  self.registration.showNotification(title, options);
});

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
