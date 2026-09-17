/**
 * ─── NEXORA PWA RUNTIME ───────────────────────────────────────────────────
 *
 * Registration, install capture, update lifecycle and platform detection.
 * Design rules:
 *  • Never interrupt a first-time visitor — install prompts appear only after
 *    real engagement.
 *  • A dismissed prompt stays dismissed (localStorage, per major version).
 *  • Real browser capabilities only — no fake install buttons.
 */

/* ─── Service worker + update lifecycle ──────────────────────────────── */

export interface PwaUpdateState {
  updateReady: boolean;
  reload: () => void;
}

let waitingWorker: ServiceWorker | null = null;
const updateListeners = new Set<(ready: boolean) => void>();

export function onUpdateStateChange(cb: (ready: boolean) => void): () => void {
  updateListeners.add(cb);
  cb(!!waitingWorker);
  return () => updateListeners.delete(cb);
}

function emitUpdateState() {
  updateListeners.forEach((cb) => cb(!!waitingWorker));
}

export function applyUpdate() {
  waitingWorker?.postMessage("SKIP_WAITING");
  // Reload once the new worker takes control of the page.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  }, { once: true });
}

export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  // Serve over HTTPS (or localhost) only — SW is a no-op on insecure origins.
  if (window.location.protocol !== "https:" && !window.location.hostname.includes("localhost")) return;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    // An update is waiting while a new SW is installed but the old one still
    // controls the page. Surface it; never auto-reload (active transactions!).
    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          waitingWorker = sw;
          emitUpdateState();
        }
      });
    });

    // Check for updates periodically (and on focus), cheaply.
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reg.update().catch(() => {});
    });

    // Detect a takeover by a waiting worker from another tab.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // If we didn't request it (applyUpdate adds its own once-listener first),
      // this page was updated from elsewhere — reload to stay consistent.
      if (!waitingWorker) window.location.reload();
    });
  } catch (err) {
    console.warn("[PWA] service worker registration failed:", err);
  }
}

/* ─── Install experience ─────────────────────────────────────────────── */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
const installListeners = new Set<(available: boolean) => void>();

export function onInstallAvailabilityChange(cb: (available: boolean) => void): () => void {
  installListeners.add(cb);
  cb(installAvailable());
  return () => installListeners.delete(cb);
}

function emitInstallAvailability() {
  installListeners.forEach((cb) => cb(installAvailable()));
}

export function installAvailable(): boolean {
  return !!deferredPrompt && !isStandalone();
}

export async function triggerInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  emitInstallAvailability();
  if (outcome === "accepted") {
    try { localStorage.setItem("nx_pwa_installed", String(Date.now())); } catch { /* private mode */ }
  }
  return outcome;
}

/** Dismissal memory — do not nag. Re-ask after ~30 days at most. */
const DISMISS_KEY = "nx_pwa_dismissed_at";
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
/** "Later" on the tiny nudge — a softer, shorter cooldown than a real dismissal. */
const LATER_KEY = "nx_pwa_later_at";
const LATER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function wasDismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (at > 0 && Date.now() - at < DISMISS_COOLDOWN_MS) return true;
    const later = Number(localStorage.getItem(LATER_KEY) || 0);
    if (later > 0 && Date.now() - later < LATER_COOLDOWN_MS) return true;
    return false;
  } catch {
    return false;
  }
}

export function markDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
}

/** User tapped "Later" on the tiny nudge — shorter, softer cooldown. */
export function markLater() {
  try { localStorage.setItem(LATER_KEY, String(Date.now())); } catch { /* private mode */ }
}

/** True when the app already runs installed / in a standalone context. */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches ||
    (navigator as any).standalone === true || // iOS Safari installed
    new URLSearchParams(window.location.search).get("source") === "pwa"
  );
}

export function isIos(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ masquerades as Mac
    (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document)
  );
}

/** Install can be offered: Chrome-style prompt exists OR iOS Safari not yet installed. */
export function canOfferInstall(): boolean {
  if (isStandalone()) return false;
  if (installAvailable()) return true;
  return isIos() && !wasDismissedRecently();
}

/**
 * Connection/battery courtesy: on save-data mode, very slow connections, or
 * critically low battery the install suggestion quietly defers (the browser
 * only exposes these when it can — otherwise we proceed).
 */
export function deviceSaysDefer(): boolean {
  try {
    const conn = (navigator as any).connection || (navigator as any).mozConnection;
    if (conn) {
      if (conn.saveData) return true;
      const et = String(conn.effectiveType || "");
      if (et === "slow-2g" || et === "2g") return true;
    }
  } catch { /* not supported — proceed */ }
  try {
    const nav = navigator as any;
    if (typeof nav.getBattery === "function") {
      // getBattery is async — a synchronous check isn't possible; cached value
      // below is refreshed by watchBatteryForDefer() at init.
      if (batteryDeferred === true) return true;
    }
  } catch { /* not supported */ }
  return false;
}

let batteryDeferred = false;
/** Best-effort battery watcher — called once from initPwa where supported. */
export function watchBatteryForDefer(): void {
  try {
    const nav = navigator as any;
    if (typeof nav.getBattery !== "function") return;
    nav.getBattery().then((b: any) => {
      const update = () => {
        batteryDeferred = !b.charging && typeof b.level === "number" && b.level < 0.15;
      };
      update();
      b.addEventListener?.("levelchange", update);
      b.addEventListener?.("chargingchange", update);
    }).catch(() => { /* ignore */ });
  } catch { /* not supported */ }
}

/**
 * Engagement gate for the TINY nudge — appears only after the visitor has
 * actually used the marketplace (browsing counts, bounce visits don't).
 */
export function shouldShowInstallPrompt(): boolean {
  if (isStandalone() || wasDismissedRecently()) return false;
  if (deviceSaysDefer()) return false;
  try {
    if (localStorage.getItem("nx_pwa_installed")) return false;
  } catch {
    return false;
  }
  try {
    const visits = Number(sessionStorage.getItem("nx_engagement") || 0);
    return visits >= 2; // tuned: second meaningful interaction, not first tap
  } catch {
    return false;
  }
}

export function recordEngagement() {
  try {
    const n = Number(sessionStorage.getItem("nx_engagement") || 0) + 1;
    sessionStorage.setItem("nx_engagement", String(n));
  } catch { /* private mode */ }
}

/** Called once from main.tsx — wires browser events. */
export function initPwa(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // take control from the mini-infobar
    deferredPrompt = e as InstallPromptEvent;
    emitInstallAvailability();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emitInstallAvailability();
    try { localStorage.setItem("nx_pwa_installed", String(Date.now())); } catch { /* ignore */ }
  });

  watchBatteryForDefer();
  void registerServiceWorker();
}
