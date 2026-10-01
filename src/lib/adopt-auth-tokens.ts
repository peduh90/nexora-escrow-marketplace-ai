/**
 * ─── ADOPTING A NEW SESSION ────────────────────────────────────────────────
 *
 * Password login mints the session server-side (`users.verifyLogin` returns the
 * access + refresh tokens). Those tokens have to reach TWO places:
 *
 *   1. browser storage, so the next page load comes back authenticated, and
 *   2. the auth provider that is ALREADY running, which keeps the token in a
 *      React ref and hands it to the Convex client.
 *
 * Writing only the localStorage keys leaves (2) untouched, so after
 * "sign out of A → sign in as B" the app can keep issuing queries with A's
 * token until something forces a full reload — the app then shows A's cached
 * profile/role while the UI says B. Dispatching the same `storage` event the
 * auth library already listens for makes the provider adopt the new token
 * immediately (see AuthProvider in @convex-dev/auth/dist/react/client.js).
 */

/** localStorage keys the auth library uses for this deployment. */
export function authTokenKeys(convexUrl: string): { token: string; refresh: string } {
  const ns = (convexUrl || "").replace(/[^a-zA-Z0-9]/g, "");
  return {
    token: `__convexAuthJWT_${ns}`,
    refresh: `__convexAuthRefreshToken_${ns}`,
  };
}

type StorageLike = Pick<Storage, "setItem" | "removeItem">;

/**
 * Build the `storage` event the auth provider listens for. Real browsers have
 * `StorageEvent`; test/non-DOM environments get an equivalent plain object so
 * the helper stays callable everywhere.
 */
function makeStorageEvent(key: string, newValue: string | null): StorageEvent {
  const storageArea = typeof window === "undefined" ? null : window.localStorage;
  if (typeof StorageEvent === "function") {
    return new StorageEvent("storage", { key, newValue, storageArea });
  }
  return { type: "storage", key, newValue, storageArea } as unknown as StorageEvent;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string | null;
}

/**
 * Persist `tokens` and hand them to the live auth provider. Returns the keys
 * that were written so callers (and tests) can assert on them.
 */
export function adoptAuthTokens(
  tokens: AuthTokens,
  convexUrl: string,
  storage: StorageLike = typeof window === "undefined" ? ({} as StorageLike) : window.localStorage,
  dispatch: (event: StorageEvent) => void =
    typeof window === "undefined" ? () => {} : (event) => window.dispatchEvent(event),
): { token: string; refresh: string } {
  const keys = authTokenKeys(convexUrl);
  storage.setItem(keys.token, tokens.token);
  if (tokens.refreshToken) {
    storage.setItem(keys.refresh, tokens.refreshToken);
  }
  dispatch(makeStorageEvent(keys.token, tokens.token));
  return keys;
}

/**
 * Drop every trace of the stored session and tell the live provider to forget
 * its in-memory copy. Used by sign-out as a belt-and-braces step: even if the
 * server-side revoke never completed, nothing on this device can authenticate
 * afterwards.
 */
export function clearStoredAuthSession(
  convexUrl: string,
  storage: StorageLike = typeof window === "undefined" ? ({} as StorageLike) : window.localStorage,
  dispatch: (event: StorageEvent) => void =
    typeof window === "undefined" ? () => {} : (event) => window.dispatchEvent(event),
): { token: string; refresh: string } {
  const keys = authTokenKeys(convexUrl);
  storage.removeItem(keys.token);
  storage.removeItem(keys.refresh);
  dispatch(makeStorageEvent(keys.token, null));
  return keys;
}
