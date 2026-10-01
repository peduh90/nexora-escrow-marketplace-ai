// @ts-ignore Bun's built-in test module is available at runtime.
import { describe, expect, test } from "bun:test";
import { absoluteSignOut, wipeLocalUserData } from "./sign-out";

/**
 * ─── SIGN-OUT HARDENING ────────────────────────────────────────────────────
 *
 * Regression tests for the account-switching/logout bug:
 *  1. A signOut() that never settles must NOT block the storage wipe and the
 *     redirect — previously that hang left the previous account fully
 *     restored on the next load ("logout doesn't log out").
 *  2. The wipe must remove every auth/user-scoped key — the auth library's
 *     real key format (`__convexAuthJWT_<escapedDeploymentUrl>`) and the
 *     `nexora:` draft namespace included — while keeping whitelisted
 *     device-level keys and foreign keys untouched.
 *  3. A throwing signOut must still complete the cleanup.
 */

// ── Real-world key fixtures ────────────────────────────────────────────────
// Matches @convex-dev/auth's useNamespacedStorage: `${key}_${namespace}` with
// every non-alphanumeric character stripped from the deployment address.
const NS = "https://usable-fish-616.convex.cloud".replace(/[^a-zA-Z0-9]/g, "");
const AUTH_LIB_KEYS = [
  `__convexAuthJWT_${NS}`,
  `__convexAuthRefreshToken_${NS}`,
  `__convexAuthOAuthVerifier_${NS}`,
  `__convexAuthServerStateFetchTime_${NS}`,
];
const USER_KEYS = [
  "nx_recent_searches",
  "nx_ref_code",
  "nx_ref_at",
  "nexora:draft:listing",
];
const DEVICE_KEYS = [
  "nx_theme",
  "nx_language",
  "nx_visitor_key",
  "nx_service_county",
  "nx_pwa_installed",
  "nx_pwa_dismissed_at",
  "nx_pwa_later_at",
];
const FOREIGN_KEYS = ["some_other_app_pref"];

/**
 * Mirror the real DOM Storage shape: stored keys are OWN enumerable
 * properties; methods live on the prototype and operate on those props
 * (which is exactly how Object.keys(localStorage) behaves in a browser).
 */
function makeStorage(initial: Record<string, string>) {
  const proto = {
    getItem(this: any, k: string) {
      return Object.prototype.hasOwnProperty.call(this, k) ? this[k] : null;
    },
    setItem(this: any, k: string, v: string) {
      this[k] = v;
    },
    removeItem(this: any, k: string) {
      delete this[k];
    },
    clear(this: any) {
      for (const k of Object.keys(this)) delete this[k];
    },
  };
  const store = Object.create(proto);
  for (const k of Object.keys(initial)) store[k] = initial[k];
  return store;
}

function resetStorage() {
  const seed: Record<string, string> = {};
  for (const k of [...AUTH_LIB_KEYS, ...USER_KEYS, ...DEVICE_KEYS, ...FOREIGN_KEYS]) {
    seed[k] = "x";
  }
  (globalThis as any).localStorage = makeStorage(seed);
  (globalThis as any).sessionStorage = makeStorage({
    admin2fa_verified: "true",
    nx_google_oauth_pending: "1",
  });
}

function keysLeft(): string[] {
  return Object.keys((globalThis as any).localStorage);
}

describe("wipeLocalUserData", () => {
  test("removes every auth token and user-scoped key", () => {
    resetStorage();
    wipeLocalUserData();
    const left = keysLeft();
    for (const k of [...AUTH_LIB_KEYS, ...USER_KEYS]) {
      expect(left).not.toContain(k);
    }
    expect((globalThis as any).sessionStorage.getItem("admin2fa_verified")).toBe(null);
    expect((globalThis as any).sessionStorage.getItem("nx_google_oauth_pending")).toBe(null);
  });

  test("keeps whitelisted device keys and foreign keys", () => {
    resetStorage();
    wipeLocalUserData();
    const left = keysLeft();
    for (const k of DEVICE_KEYS) expect(left).toContain(k);
    expect(left).toContain("some_other_app_pref");
  });
});

describe("absoluteSignOut", () => {
  test("a signOut that NEVER settles still wipes and redirects (root cause)", async () => {
    resetStorage();
    let replaced: string | null = null;
    (globalThis as any).window = {
      location: { replace: (u: string) => { replaced = u; } },
    };
    const started = Date.now();
    await absoluteSignOut(() => new Promise(() => { /* hangs forever */ }));
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(4000);
    expect(replaced).toBe("/?signedout=1");
    expect(keysLeft().some((k) => k.startsWith("__convexAuthJWT"))).toBe(false);
    expect(keysLeft().some((k) => k.startsWith("nexora:draft"))).toBe(false);
  }, 10000);

  test("a healthy signOut resolves fast and performs the same cleanup", async () => {
    resetStorage();
    let replaced: string | null = null;
    (globalThis as any).window = {
      location: { replace: (u: string) => { replaced = u; } },
    };
    let revoked = false;
    const started = Date.now();
    await absoluteSignOut(async () => {
      revoked = true;
    });
    expect(revoked).toBe(true);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(replaced).toBe("/?signedout=1");
    const left = keysLeft();
    expect(left.every((k) => DEVICE_KEYS.includes(k) || FOREIGN_KEYS.includes(k))).toBe(true);
  });

  test("a throwing signOut still completes the cleanup", async () => {
    resetStorage();
    let replaced: string | null = null;
    (globalThis as any).window = {
      location: { replace: (u: string) => { replaced = u; } },
    };
    await absoluteSignOut(async () => {
      throw new Error("network down");
    });
    expect(replaced).toBe("/?signedout=1");
    expect(keysLeft().some((k) => k.startsWith("__convexAuth"))).toBe(false);
  });
});
