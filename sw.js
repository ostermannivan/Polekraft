// Polekraft – Offline-Cache. Bei Updates die Versionsnummer erhöhen (Monat.Jahr.Nummer).
// Eigener Cache-Name – getrennt von Kraftwerk. Aufgeräumt werden nur eigene alte Caches („polekraft-…“).
const CACHE = "polekraft-11.26.1";
const PREFIX = "polekraft-";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./heart.png", "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./splash-1080x2340.png", "./splash-1170x2532.png", "./splash-1179x2556.png", "./splash-1206x2622.png", "./splash-1284x2778.png",
  "./splash-1290x2796.png", "./splash-1320x2868.png", "./splash-750x1334.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
// Seite selbst: erst Netz (max. 2,5 s), sonst Cache → Updates kommen sofort an, offline läuft alles weiter
function networkFirst(req) {
  const net = fetch(req, { cache: "no-store" }).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); }
    return res;
  });
  const timeout = new Promise((_, rej) => setTimeout(() => rej("timeout"), 2500));
  return Promise.race([net, timeout]).catch(() => caches.open(CACHE).then((c) => c.match("./index.html")));
}
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") { e.respondWith(networkFirst(e.request)); return; }
  e.respondWith(
    caches.open(CACHE).then((c) => c.match(e.request, { ignoreSearch: true })).then((hit) =>
      hit || fetch(e.request).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      }),
    ),
  );
});
