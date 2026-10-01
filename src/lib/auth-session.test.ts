// @ts-ignore
import { describe, expect, test } from "bun:test";
import {
  matchRowsByEmail,
  shouldCreateInitialPasswordHash,
} from "./password-credential";
import {
  adoptAuthTokens,
  authTokenKeys,
  clearStoredAuthSession,
} from "./adopt-auth-tokens";

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    map,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    getItem: (k: string) => map.get(k) ?? null,
  };
}

const URL_A = "https://usable-fish-616.convex.cloud";

describe("credential row lookup", () => {
  test("matches the stored email regardless of the casing typed", () => {
    const rows = [{ email: "Ells@Example.com" }, { email: "other@x.com" }];
    expect(matchRowsByEmail(rows, "ells@example.com")).toHaveLength(1);
    expect(matchRowsByEmail(rows, "ELLS@EXAMPLE.COM")).toHaveLength(1);
    expect(matchRowsByEmail(rows, "  ells@example.com  ")).toHaveLength(1);
  });

  test("does not match a different address or an empty one", () => {
    const rows = [{ email: "ells@example.com" }];
    expect(matchRowsByEmail(rows, "someone@else.com")).toHaveLength(0);
    expect(matchRowsByEmail(rows, "")).toHaveLength(0);
  });
});

describe("profile sync password policy", () => {
  test("never replaces a password that is already stored", () => {
    // The regression that broke real logins: a profile sync carrying a stale
    // password used to overwrite the stored hash, so the account kept working
    // until the next sign-in rejected the user's real password.
    expect(shouldCreateInitialPasswordHash("pbkdf2:aa:bb", "SomeOtherPassword!9")).toBe(false);
  });

  test("creates the first password when the account has none", () => {
    expect(shouldCreateInitialPasswordHash(undefined, "FirstPassword!9")).toBe(true);
    expect(shouldCreateInitialPasswordHash("", "FirstPassword!9")).toBe(true);
  });

  test("ignores an empty password", () => {
    expect(shouldCreateInitialPasswordHash(undefined, "   ")).toBe(false);
  });
});

describe("adopting a new session", () => {
  test("stores both tokens under the deployment-namespaced keys", () => {
    const keys = authTokenKeys(URL_A);
    expect(keys.token).toBe("__convexAuthJWT_httpsusablefish616convexcloud");
    expect(keys.refresh).toBe("__convexAuthRefreshToken_httpsusablefish616convexcloud");
  });

  test("writes the tokens AND tells the live auth provider about them", () => {
    const storage = fakeStorage();
    const events: StorageEvent[] = [];
    adoptAuthTokens(
      { token: "jwt-b", refreshToken: "refresh-b" },
      URL_A,
      storage,
      (e) => events.push(e),
    );
    expect(storage.getItem(authTokenKeys(URL_A).token)).toBe("jwt-b");
    expect(storage.getItem(authTokenKeys(URL_A).refresh)).toBe("refresh-b");
    // Without this event the running provider keeps the PREVIOUS account's
    // token in memory and every query goes out as that account.
    expect(events).toHaveLength(1);
    expect(events[0]!.key).toBe(authTokenKeys(URL_A).token);
    expect(events[0]!.newValue).toBe("jwt-b");
  });

  test("sign-out clears both keys and announces the removal", () => {
    const storage = fakeStorage();
    storage.setItem(authTokenKeys(URL_A).token, "jwt-a");
    storage.setItem(authTokenKeys(URL_A).refresh, "refresh-a");
    const events: StorageEvent[] = [];
    clearStoredAuthSession(URL_A, storage, (e) => events.push(e));
    expect(storage.getItem(authTokenKeys(URL_A).token)).toBeNull();
    expect(storage.getItem(authTokenKeys(URL_A).refresh)).toBeNull();
    expect(events[0]!.newValue).toBeNull();
  });
});
