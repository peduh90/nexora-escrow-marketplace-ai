/**
 * ─── ABSOLUTE SIGN-OUT ──────────────────────────────────────────────────────
 *
 * Signing out must be ABSOLUTE: the next person (or the same person Registering
 * under a different role) must land on a completely clean app — no cached
 * role state, no remembered drafts, no stale wallet/orders data in browser
 * storage, and no in-memory Convex cache surviving (guaranteed by the hard
 * reload below).
 *
 * What is KEPT deliberately (device-level, not user-scoped):
 *   - nx_theme / nx_language            → appearance preferences
 *   - nx_visitor_key                    → anonymous device id (referral
 *     attribution integrity — clearing it would break creator attribution)
 *   - nx_service_county                 → county picker convenience
 *   - nx_pwa_*                          → PWA install-prompt state (device)
 *
 * Everything else the app stores under the `nx_` namespace is user-scoped
 * (drafts, searches, engagement) and is wiped. Convex auth tokens are cleared
 * by the auth stack's signOut() and again defensively here. sessionStorage is
 * cleared entirely — it never holds anything device-level.
 *
 * One email = one account = one role (enforced server-side in convex/roles.ts
 * and convex/users.ts): after an absolute sign-out, registering with the SAME
 * email signs back into that same account — it can never create a second role
 * on it. A different role requires a different email, which creates a fresh
 * account cleanly; this wipe guarantees the old session cannot influence it.
 */

/** Device-level keys that survive sign-out (appearance, PWA, attribution). */
const KEEP_LOCAL_KEYS = new Set([
  "nx_theme",
  "nx_language",
  "nx_visitor_key",
  "nx_service_county",
  "nx_pwa_installed",
  "nx_pwa_dismissed_at",
  "nx_pwa_later_at",
]);

/** Remove every user-scoped browser-storage entry for this device session. */
export function wipeLocalUserData(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (KEEP_LOCAL_KEYS.has(key)) continue;
      // Our own namespaces (`nx_` + `nexora:` draft keys) plus any Convex
      // auth-token storage (`__convexAuthJWT_*` / `__convexAuthRefreshToken_*`
      // are keyed with the deployment address, which always contains
      // "convex"). Anything user-scoped — drafts, searches, referral memory,
      // session tokens — goes; only whitelisted device-level keys survive.
      if (key.startsWith("nx_") || key.startsWith("nexora:") || /convex/i.test(key)) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
  } catch {
    /* private browsing — storage unavailable, nothing to wipe */
  }
}

/**
 * Full sign-out: revoke the auth session, wipe every user-scoped storage
 * entry, then hard-reload to the landing page. The reload is what makes it
 * "absolute" — every in-memory cache (Convex query cache, React state,
 * router history) dies with the page, so whatever happens next — signing
 * back in or registering another account — starts from zero.
 *
 * `location.replace` keeps the signed-out page out of history, so Back can
 * never return to an authenticated screen.
 */
export async function absoluteSignOut(signOutFn: () => Promise<unknown>): Promise<void> {
  // The revoke must never be able to block the cleanup. On a flaky or idle
  // connection signOut() can stay pending indefinitely (the Convex client's
  // action call has no timeout of its own), which used to freeze this
  // function mid-flight — the wipe and the reload below never ran, so the
  // page simply came back as the previous account ("logout doesn't log out").
  // Race the revoke against a hard deadline: the client-side wipe is what
  // actually ends the session on this device, and these tokens are the only
  // copy the browser holds — once gone, the session is unusable here even if
  // the server-side revoke was skipped.
  await Promise.race([
    (async () => {
      try {
        await signOutFn();
      } catch {
        /* session may already be gone — cleanup continues regardless */
      }
    })(),
    new Promise<void>((resolve) => setTimeout(resolve, 3000)),
  ]);
  wipeLocalUserData();
  window.location.replace("/?signedout=1");
}

/**
 * Back/forward-cache can restore a page as a complete frozen JS heap —
 * in-memory React state, the Convex client's auth token, everything — without
 * re-running mount. After a sign-out, pressing Back could therefore resurrect
 * the previous account's panel with a still-valid token until the next real
 * navigation. Any restored page is force-reloaded so it re-reads the (now
 * cleared) auth storage and the route guards re-verify identity against the
 * backend. Idempotent — safe to call from effects that run repeatedly.
 */
export function installBfcacheAuthGuard(): void {
  if ((window as any).__nxBfcacheGuard) return;
  (window as any).__nxBfcacheGuard = true;
  window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted) {
      window.location.reload();
    }
  });
}
