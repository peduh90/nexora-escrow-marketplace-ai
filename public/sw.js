/*
 * ─── NEXORA SERVICE WORKER ────────────────────────────────────────────────
 *
 * One rule above all: this is a FINANCIAL marketplace. The service worker
 * NEVER caches authenticated API traffic, Convex responses, payments, wallet,
 * KYC, messages or escrow state. Every transactional byte always goes to the
 * network. Caching is limited to:
 *
 *   1. Static app assets (hashed Vite bundles) — cache-first, versioned
 *   2. Public brand/static files (icons, manifest, fonts) — stale-while-revalidate
 *   3. Public marketplace pages/documents      — network-first with cache backup
 *
 * Everything else — /api/*, Convex endpoints, POST/PUT/PATCH, anything with
 * credentials — passes straight through untouched.
 *
 * Update strategy: this SW activates immediately when a new version waits
 * (skipWaiting) and the client is told via a message so the app can offer a
 * non-destructive "Update available" toast. Old caches are cleaned on activate.
 * Active checkouts are never interrupted — the app applies the reload only
 * when the user taps Update.
 */

const VERSION = "nx-v4"; // v4: refresh cached app bundles after the freelance join-card update
const STATIC_CACHE = `nx-static-${VERSION}`;
const PAGE_CACHE = `nx-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";

/* Exact-match static precache (small, safe, brand-critical only). */
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/logo.svg",
];

/* ─── Install: precache the offline shell ─────────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))));
      // Do NOT skipWaiting here — the app decides when (see message handler).
    })(),
  );
});

/* ─── Activate: clean old versions, take control ──────────────────────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("nx-") && n !== STATIC_CACHE && n !== PAGE_CACHE)
          .map((n) => caches.delete(n)),
      );
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.enable(); } catch { /* not supported */ }
      }
      await self.clients.claim();
    })(),
  );
});

/* ─── Message: app-driven update flow ─────────────────────────────────── */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data === "PING") {
    event.source?.postMessage({ type: "PONG", version: VERSION });
  }
});

/* ─── Helpers ──────────────────────────────────────────────────────────── */

/** Never intercept these — private, authenticated or transactional. */
function isForbidden(url) {
  return (
    // Convex backend (all queries/mutations/actions/auth)
    url.hostname.endsWith(".convex.cloud") ||
    url.hostname === "convex.cloud" ||
    // Any same-origin API surface
    url.pathname.startsWith("/api") ||
    // Payments/callbacks
    url.pathname.startsWith("/payments") ||
    url.pathname.startsWith("/mpesa") ||
    // Anything explicitly dynamic
    url.searchParams.has("no-sw")
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|svg|ico)$/) !== null ||
    url.pathname.startsWith("/icons/")
  );
}

/* ─── Fetch handler ────────────────────────────────────────────────────── */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET is cacheable. Everything else passes through untouched.
  if (request.method !== "GET") return;

  let url;
  try { url = new URL(request.url); } catch { return; }

  // Cross-origin: only allow image CDNs through (SWR); everything else ignored.
  if (url.origin !== self.location.origin) {
    if (isForbidden(url)) return;
    if (url.hostname.includes("convex") || url.hostname.includes("mpesa") || url.hostname.includes("safaricom")) return;
    if (request.headers.get("accept")?.includes("text/html")) return;
    // CDN images: stale-while-revalidate
    if (url.pathname.match(/\.(png|jpe?g|webp|gif|svg)$/)) {
      event.respondWith(staleWhileRevalidate(request, PAGE_CACHE));
    }
    return;
  }

  if (isForbidden(url)) return;

  // 1) Navigations: network-first with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  // 2) Static assets: cache-first (hashed filenames are immutable).
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 3) Public documents/pages (shareable deep links): network-first.
  event.respondWith(networkFirst(request, PAGE_CACHE));
});

/* Strategies ─────────────────────────────────────────────────────────── */

async function handleNavigation(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      // Cache a copy of public pages for offline replay of deep links.
      const cache = await caches.open(PAGE_CACHE);
      cache.put(event.request, preload.clone()).catch(() => {});
      return preload;
    }
    return await fetch(event.request);
  } catch {
    // Offline: serve the cached page if we have it, else branded offline page.
    const cached = await caches.match(event.request, { ignoreSearch: false });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline ?? new Response("Nexora is offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    return new Response("", { status: 504 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok) {
        caches.open(cacheName).then((c) => c.put(request, res.clone()).catch(() => {}));
      }
      return res;
    })
    .catch(() => null);
  return cached ?? (await network) ?? new Response("", { status: 504 });
}

/* ─── Push notifications (deep-link routed) ────────────────────────────── */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Nexora", body: event.data ? event.data.text() : "" };
  }

  // Never expose sensitive info on the lock screen — keep bodies generic.
  const title = payload.title || "Nexora";
  const options = {
    body: payload.body || "You have a new update in Nexora.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    tag: payload.tag || "nexora",
    data: { url: payload.url || "/marketplace" },
    vibrate: [80, 40, 80],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* Notification click → deep link into the exact entity. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/marketplace";
  const full = new URL(target, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Focus an existing window and navigate it to the deep link.
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin)) {
          await client.focus();
          client.postMessage({ type: "NAVIGATE", url: full });
          return;
        }
      }
      await self.clients.openWindow(full);
    })(),
  );
});
