/* Leiterbahn SW — network-first for HTML so deploys land promptly; versioned cache. */
var CACHE = "leiterbahn-v1.6";
self.addEventListener("install", function (e) {
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
function isHTML(req) {
  var u = new URL(req.url);
  var p = u.pathname;
  if (req.mode === "navigate") return true;
  if (p.endsWith("/") || p.endsWith("/index.html") || p.endsWith("/leiterbahn") || p.endsWith("/leiterbahn/")) return true;
  var accept = req.headers.get("accept") || "";
  return accept.indexOf("text/html") >= 0;
}
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (isHTML(req)) {
    e.respondWith(
      fetch(req).then(function (res) {
        try {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        } catch (err) {}
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        try {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        } catch (err) {}
        return res;
      });
    })
  );
});
