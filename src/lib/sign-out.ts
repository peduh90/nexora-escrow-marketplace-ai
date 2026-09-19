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
      // Our own namespace plus any Convex auth-token storage.
      if (key.startsWith("nx_") || /convex/i.test(key)) {
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
  try {
    await signOutFn();
  } catch {
    /* session may already be gone — cleanup continues regardless */
  }
  wipeLocalUserData();
  window.location.replace("/?signedout=1");
}
