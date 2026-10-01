/**
 * ─── CREDENTIAL LOOKUP RULES ───────────────────────────────────────────────
 *
 * Pure helpers shared by the Convex login/profile mutations. They live here
 * (not inline in `convex/users.ts`) so the rules that decide whether a VALID
 * password is accepted can be regression-tested without a Convex runtime.
 */

/**
 * Rows of one account that belong to `email`, compared case-insensitively.
 *
 * Email addresses are case-insensitive in practice, but the `users.email`
 * index is an exact-match index. A lookup built only on it rejected a 100%
 * correct password whenever the stored casing differed from what the user
 * typed — reported as "Invalid email or password." for a password that was
 * right.
 */
export function matchRowsByEmail<T extends { email?: unknown }>(
  rows: T[],
  emailRaw: string,
): T[] {
  const wanted = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  if (!wanted) return [];
  return rows.filter(
    (row) => typeof row?.email === "string" && row.email.trim().toLowerCase() === wanted,
  );
}

/**
 * Whether a profile sync may WRITE a password hash for this account.
 *
 * A profile sync is not a password-change channel. It may only create the
 * FIRST password for an account that has none; an account that already has a
 * stored credential keeps it, no matter what string the sync carried.
 *
 * Why this matters: the old rule ("overwrite whenever the submitted password
 * doesn't match") silently replaced a working password with whatever happened
 * to be sitting in the sign-in form. The session kept working, so the account
 * looked healthy — the damage only surfaced at the NEXT login, as "my correct
 * password is rejected". Deliberate changes go through `resetPassword`
 * (emailed code) and `updatePassword` (current password).
 */
export function shouldCreateInitialPasswordHash(
  existingHash: unknown,
  incomingPassword: unknown,
): boolean {
  const hasExisting = typeof existingHash === "string" && existingHash.length > 0;
  if (hasExisting) return false;
  return typeof incomingPassword === "string" && incomingPassword.trim().length > 0;
}
