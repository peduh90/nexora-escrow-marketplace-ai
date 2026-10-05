import { getAuthUserId } from "@convex-dev/auth/server";
import { v, ConvexError } from "convex/values";
import {
  matchRowsByEmail,
  shouldCreateInitialPasswordHash,
} from "../lib/password-credential";
import { query, mutation, internalMutation, QueryCtx, MutationCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { ALLOWED_ROLES, resolveRole, resolveRoleForAdminFlow, ADMIN_EMAIL } from "./roles";
import type { AllowedRole } from "./roles";
// Shared with the client (src/lib/kenyan-phone.ts): one strict validator
// gates registration on BOTH sides — instant feedback in the form,
// authoritative enforcement on the server.
import { kenyanPhoneError, normalizeKenyanPhone } from "../lib/kenyan-phone";

/**
 * Normalize ANY accepted Kenyan phone format to the canonical 2547XXXXXXXX
 * form on every write. When the input doesn't match a Kenyan mobile format
 * (a foreign number, a landline, etc.) the raw trimmed input is kept so no
 * data is ever lost — the strict kenyanPhoneError gate still decides whether
 * that raw value may complete registration.
 */
function normalizePhoneOrKeep(raw: string | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return normalizeKenyanPhone(trimmed) ?? trimmed;
}
import type { Id } from "./_generated/dataModel";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    // Strip credential material before exposing the record to the client.
    // These fields must never leave the server.
    const safe: Record<string, any> = { ...(user as any) };
    delete safe.passwordHash;
    delete safe.adminPasswordHash;
    delete safe.adminPasswordSalt;
    delete safe.adminTotpSecret;
    return safe;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

/**
 * Resolve the current session's user record.
 *
 * Binds to the auth session's OWN users doc first (getAuthUserId) and only
 * falls back to an email lookup when the identity actually carries an email.
 * NEVER falls back to "any user": a session whose identity has no email must
 * not silently bind to an arbitrary record (e.g. the oldest anonymous user),
 * which is exactly what made "My Products" show another account's listings
 * and made new products attach to the wrong account.
 */
export const getSessionUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId !== null) {
    const user = await ctx.db.get(userId);
    if (user) return user as any;
  }
  const identity = await ctx.auth.getUserIdentity();
  const email = typeof identity?.email === "string" ? identity.email : null;
  if (email && email.length > 0) {
    // The same person can own several user rows with one email (guest → email
    // upgrade, OTP vs Google). Always resolve the canonical record, never an
    // arbitrary empty duplicate — that is what made dashboards show another
    // (or an empty) account after login.
    const rows = (await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .collect()) as any[];
    const best = pickCanonicalUser(rows);
    if (best) return best;
  }
  return null;
};

// ─── DUPLICATE ACCOUNT RESOLUTION & MERGE ──────────────────────────────────

/**
 * Score a user record by how "real" and complete it is. Used to pick the one
 * canonical account when several rows share an email.
 */
function canonicalScore(u: any): number {
  return (
    (u?.isAnonymous ? 0 : 2) +
    (typeof u?.role === "string" && u.role ? 4 : 0) +
    (typeof u?.businessName === "string" && u.businessName ? 2 : 0) +
    (typeof u?.passwordHash === "string" && u.passwordHash ? 1 : 0)
  );
}

function pickCanonicalUser(rows: any[]): any | null {
  if (!rows || rows.length === 0) return null;
  if (rows.length === 1) return rows[0];
  return [...rows].sort(
    (a, b) =>
      canonicalScore(b) - canonicalScore(a) ||
      (a?._creationTime ?? 0) - (b?._creationTime ?? 0),
  )[0];
}

// Profile fields copied from a duplicate onto the canonical record when the
// canonical one is missing them.
const PROFILE_FILL_FIELDS = [
  "name", "image", "phone", "county", "town", "country", "currency",
  "role", "businessName", "businessType", "kycStatus", "kycSubmittedAt",
  "kycVerifiedAt", "kycDocuments", "sellerTier", "commissionRate",
  "subscriptionTier", "subscriptionExpiry", "whatsapp", "facebook",
  "instagram", "tiktok", "passwordHash", "joinedAt", "lastLoginAt",
  "lastActivityAt", "emailVerified", "phoneVerified", "totalTransactions",
] as const;

// User-scoped tables moved from duplicates onto the canonical account so NO
// data (listings, orders, wallet history, freelance work, …) is ever lost.
const OWNED_TABLE_FIELDS: Array<[string, string[]]> = [
  ["listings", ["sellerId"]],
  ["walletTransactions", ["userId"]],
  ["notifications", ["userId"]],
  ["kycApplications", ["userId"]],
  ["messages", ["senderId", "receiverId"]],
  ["conversations", ["buyerId", "sellerId"]],
  ["reviews", ["buyerId", "sellerId"]],
  ["escrows", ["buyerId", "sellerId"]],
  ["disputes", ["filedBy"]],
  ["deliveries", ["driverId"]],
  ["freelanceProfiles", ["userId"]],
  ["freelanceTasks", ["employerId"]],
  ["freelanceApplications", ["freelancerId"]],
  ["freelanceProjects", ["employerId", "freelancerId"]],
  ["freelanceEarnings", ["freelancerId"]],
  ["freelanceReviews", ["reviewerId", "revieweeId"]],
  ["freelanceMessages", ["senderId"]],
  ["jobPosts", ["posterId"]],
  ["jobApplications", ["applicantId"]],
  ["supportTickets", ["userId"]],
  ["ticketMessages", ["senderId"]],
  ["aiAuditLog", ["userId"]],
  ["fraudAlerts", ["userId"]],
];

/**
 * Every `users` row that belongs to this email address, matched
 * CASE-INSENSITIVELY.
 *
 * The `email` index is an exact-match index, so a lookup with the casing the
 * user happened to type misses whenever the stored row differs ("Ells@x.com"
 * vs "ells@x.com"). Email addresses are case-insensitive in practice, and a
 * miss here produced the single most misleading failure in the login flow: a
 * 100% correct password reported as "Invalid email or password." Only when
 * both index probes miss do we fall back to a bounded scan, so the common path
 * stays an index lookup.
 */
async function findUserRowsByEmail(ctx: any, emailRaw: string): Promise<any[]> {
  const email = typeof emailRaw === "string" ? emailRaw.trim() : "";
  if (!email) return [];

  const byExact = async (value: string): Promise<any[]> =>
    (await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", value))
      .collect()) as any[];

  let rows = await byExact(email);
  const lower = email.toLowerCase();
  if (rows.length === 0 && lower !== email) {
    rows = await byExact(lower);
  }
  if (rows.length === 0) {
    const sample = (await ctx.db.query("users").take(500)) as any[];
    rows = matchRowsByEmail(sample, lower);
  }
  return rows;
}

/**
 * Merge every user row sharing `email` into a single canonical account.
 *
 * Broken early-auth flows (guest → email upgrade, OTP vs Google sign-in) left
 * one person split across two records: the password on one row, the role and
 * listings on another. Logging in bound the session to whichever row the auth
 * library resolved first — the "seller data disappears after login" bug.
 *
 * This moves ALL owned data (listings, escrows, wallet history, freelance
 * records, …) onto the best record, sums wallet balances, re-points auth
 * sessions/accounts, then deletes the empty duplicates. Safe to call any time;
 * it is a no-op when only one row exists for the email.
 */
async function mergeDuplicateAccountsByEmail(ctx: any, email: string): Promise<any | null> {
  if (typeof email !== "string" || email.length === 0) return null;

  const rows = (await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", email))
    .collect()) as any[];
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0];

  const keep = pickCanonicalUser(rows);
  const duplicates = rows.filter((r) => r._id !== keep._id);

  // Fill missing profile fields and sum balances so nothing is lost.
  const fillPatch: Record<string, any> = {};
  let walletSum = typeof keep.walletBalance === "number" ? keep.walletBalance : 0;
  let escrowSum = typeof keep.escrowBalance === "number" ? keep.escrowBalance : 0;
  for (const d of duplicates) {
    walletSum += typeof d.walletBalance === "number" ? d.walletBalance : 0;
    escrowSum += typeof d.escrowBalance === "number" ? d.escrowBalance : 0;
    for (const f of PROFILE_FILL_FIELDS) {
      if (fillPatch[f] === undefined && keep[f] === undefined && d[f] !== undefined) {
        fillPatch[f] = d[f];
      }
    }
  }
  fillPatch.walletBalance = walletSum;
  fillPatch.escrowBalance = escrowSum;
  await ctx.db.patch(keep._id, fillPatch);

  // Move every owned record onto the canonical account.
  for (const [table, fields] of OWNED_TABLE_FIELDS) {
    for (const field of fields) {
      for (const d of duplicates) {
        try {
          const docs = await ctx.db
            .query(table)
            .filter((q: any) => q.eq(q.field(field), d._id))
            .collect();
          for (const doc of docs) {
            await ctx.db.patch(doc._id, { [field]: keep._id });
          }
        } catch {
          // Table missing in older deployments — skip.
        }
      }
    }
  }

  // Recompute the active listing count after the move.
  try {
    const active = await ctx.db
      .query("listings")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", keep._id))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .collect();
    await ctx.db.patch(keep._id, { activeListings: active.length });
  } catch {
    // Non-critical.
  }

  // Re-point auth sessions/accounts bound to duplicates (keeps the current
  // session alive after the duplicate row is deleted), then remove the
  // duplicates so admin lists and user counts stay truthful.
  for (const d of duplicates) {
    for (const table of ["authSessions", "authAccounts"]) {
      try {
        const refs = await ctx.db
          .query(table)
          .filter((q: any) => q.eq(q.field("userId"), d._id))
          .collect();
        for (const ref of refs) {
          await ctx.db.patch(ref._id, { userId: keep._id });
        }
      } catch {
        // Table not directly accessible — the dangling ref is harmless.
      }
    }
    try {
      await ctx.db.delete(d._id);
    } catch {
      // If deletion fails the row stays as an empty husk; the merge of data
      // and the canonical binding still hold.
    }
  }

  return await ctx.db.get(keep._id);
}

/**
 * Secure password hashing for persistent Nexora user accounts.
 * Uses PBKDF2-HMAC-SHA256 with a per-password random salt and a derived key.
 * IMPORTANT: never logs or returns the hash to the client, and never stores
 * the plaintext password.
 *
 * Format: pbkdf2:<saltHex>:<iterations>:<keyLen>:<algorithm>:<derivedHex>
 *
 * `derivedHex` is a hex-encoded 256-bit PBKDF2 output, not the plaintext and
 * not a single SHA-256 round over `salt + password`.
 */
export async function hashStoredPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Web Crypto requires the password to be imported as a PBKDF2 CryptoKey
  // before deriveBits. Passing raw bytes as the baseKey throws
  // "TypeError: not of type CryptoKey" at runtime.
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedKey = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    256,
  );
  const derivedBytes = new Uint8Array(derivedKey);
  const derivedHex = Array.from(derivedBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `pbkdf2:${saltHex}:100000:32:sha256:${derivedHex}`;
}

/**
 * Verify a password against a stored PBKDF2 hash.
 * Returns false for unknown formats or missing inputs.
 *
 * Legacy handling: entries whose stored value does not parse as a real PBKDF2
 * record are treated as INVALID for authentication purposes. We no longer accept
 * plaintext-equal verifiers as valid logins. If an existing user's stored hash is
 * somehow legacy/invalid, the correct recovery path is a password reset, not
 * silent plaintext acceptance.
 */
export async function verifyStoredPasswordHash(storedHash: string, password: string): Promise<boolean> {
  if (typeof storedHash !== "string" || typeof password !== "string") return false;
  if (!storedHash.startsWith("pbkdf2:")) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 6) return false;

  const [, saltHex, iterationsStr, keyLengthStr, algorithm, derivedHex] = parts;
  if (!saltHex || !iterationsStr || !keyLengthStr || !algorithm || !derivedHex) return false;
  if (algorithm !== "sha256") return false;

  const iterations = Number(iterationsStr);
  const keyLength = Number(keyLengthStr);
  if (!Number.isFinite(iterations) || iterations <= 0 || !Number.isFinite(keyLength) || keyLength <= 0) return false;

  let saltBytes: Uint8Array;
  try {
    if (saltHex.length % 2 !== 0) return false;
    saltBytes = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  } catch {
    return false;
  }

  if (saltBytes.length === 0) return false;

  try {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const derivedKey = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes as BufferSource, iterations, hash: "SHA-256" },
      baseKey,
      keyLength * 8,
    );
    const derivedBytes = new Uint8Array(derivedKey);
    const computedHex = Array.from(derivedBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return computedHex === derivedHex;
  } catch {
    return false;
  }
}


/**
 * Check if the current user is an admin
 */

/**
 * Check if email/phone/business name already exists
 */
export const checkDuplicateUser = query({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    businessName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("users").collect();
    const results: any = { emailExists: false, phoneExists: false, businessNameExists: false };

    for (const user of all) {
      if (args.email && user.email?.toLowerCase() === args.email.toLowerCase()) {
        results.emailExists = true;
      }
      if (args.phone && user.phone?.replace(/\D/g, "") === args.phone.replace(/\D/g, "")) {
        results.phoneExists = true;
      }
      if (args.businessName && user.businessName?.toLowerCase() === args.businessName.toLowerCase()) {
        results.businessNameExists = true;
      }
    }
    return results;
  },
});

/**
 * Verify login with email + password.
 *
 * IMPORTANT: This mirrors the auth provider identity to the Nexora users table
 * and resolves role from the persistent DB record, not from the client.
 * Plain-text password comparison is removed — passwords must be verified
 * against a stored hash. For this codebase we keep a deterministic verify path
 * that rejects plaintext storage and common weak passwords.
 */
export const verifyLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.password.length < 8) {
      return { success: false, error: "Invalid email or password." };
    }

    // Collect EVERY row that belongs to this email, then verify the submitted
    // password against them BEFORE anything is merged or deleted.
    //
    // Two rules this restores:
    //  1. Email addresses are case-insensitive. The index is exact, so a
    //     correctly-typed password used to be rejected purely because the
    //     stored casing differed ("Invalid email or password." for a password
    //     that was right).
    //  2. A duplicate row may hold the credential that actually authenticates
    //     while the canonical row holds a different (stale) one. Verifying
    //     first — and carrying the proven hash onto the surviving account —
    //     means a merge can never throw away the only working password.
    const rows = await findUserRowsByEmail(ctx, args.email);

    if (rows.length === 0) {
      return { success: false, error: "Invalid email or password." };
    }

    // Do not reveal whether the email exists. A stored value must be a real
    // PBKDF2 record; plaintext storage is never accepted as a login.
    let matchedRow: any = null;
    for (const row of rows) {
      const stored = (row as any).passwordHash;
      if (typeof stored !== "string" || !stored.startsWith("pbkdf2:")) continue;
      if (await verifyStoredPasswordHash(stored, args.password)) {
        matchedRow = row;
        break;
      }
    }

    if (!matchedRow) {
      return { success: false, error: "Invalid email or password." };
    }

    // Now that the credential is proven, collapse duplicate rows for this
    // email into one account, then make sure the surviving account carries the
    // hash that just authenticated — a merge must never leave the account
    // holding a hash nobody can log in with.
    const user = await mergeDuplicateAccountsByEmail(ctx, matchedRow.email);
    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }
    const u = user as any;
    if (
      (matchedRow as any)._id !== u._id &&
      typeof (matchedRow as any).passwordHash === "string" &&
      u.passwordHash !== (matchedRow as any).passwordHash
    ) {
      await ctx.db.patch(u._id, { passwordHash: (matchedRow as any).passwordHash });
    }

    // ---- Role repair on login ------------------------------------------
    // A user's role is LOCKED at registration. Login only repairs accounts
    // with a MISSING role by reading the evidence already on the record
    // (provider profiles, business name) — it never converts an active
    // account from one role to another. Service providers registered via the
    // old "Offer a Service" flow (stuck as buyer) are corrected to
    // service_provider by the presence of a serviceProfiles/transportProfiles
    // row — the profile data is the truth, the role field was the bug.
    const hasBusinessName =
      typeof u.businessName === "string" && u.businessName.trim().length > 0;
    let role = typeof u.role === "string" && u.role ? u.role : null;

    // Platform owner ALWAYS resolves to admin + active on login, even from a
    // stale buyer/pending record created before the verification gate. Without
    // this the owner is trapped in the buyer panel with no route to /admin.
    if (u.email === ADMIN_EMAIL) {
      role = "admin";
      await ctx.db.patch(u._id, {
        role: "admin" as any,
        accountStatus: "active" as any,
        pendingRole: undefined,
      });
    } else {
      // Provider repair: a registered provider profile is definitive proof of
      // the intended role. Only applied when the stored role is missing or
      // still the old default (buyer) — never when the user holds another
      // real role (seller/freelancer/…).
      if (!role || role === "buyer") {
        let providerRole: "service_provider" | "driver" | null = null;
        try {
          const svc = await ctx.db
            .query("serviceProfiles")
            .withIndex("by_user", (q) => q.eq("userId", u._id))
            .first();
          if (svc) providerRole = "service_provider";
        } catch {
          // Table missing in older deployments — skip.
        }
        if (!providerRole) {
          try {
            const tp = await ctx.db
              .query("transportProfiles")
              .withIndex("by_user", (q) => q.eq("userId", u._id))
              .first();
            if (tp) providerRole = "driver";
          } catch {
            // Table missing in older deployments — skip.
          }
        }
        if (providerRole) {
          role = providerRole;
          await ctx.db.patch(u._id, { role: providerRole as any });
        }
      }

      if (hasBusinessName && role !== "seller" && role !== "admin" && role !== "creator" && !role) {
        role = "seller";
        await ctx.db.patch(u._id, { role: "seller" as any });
      } else if (!role) {
        const inferred = inferRole(u);
        if (typeof inferred === "string" && inferred) {
          role = inferred;
          await ctx.db.patch(u._id, { role: inferred as any });
        }
      }
    }
    await ctx.db.patch(u._id, { lastActivityAt: Date.now() });

    const fresh = await ctx.db.get(u._id);
    const resolved = fresh as any;

    let finalRole =
      typeof resolved?.role === "string" && resolved.role
        ? resolved.role
        : role;

    // One more infer + persist attempt from the freshly-read record before
    // deciding what to return.
    if (!finalRole) {
      const inferred = inferRole(resolved ?? u);
      if (typeof inferred === "string" && inferred) {
        await ctx.db.patch((resolved ?? u)._id, { role: inferred as any });
        finalRole = inferred;
      }
    }

    // Create a REAL auth session for this user and return its tokens.
    // Password login previously only verified credentials and navigated — it
    // never created a session, so protected routes had no auth and hung on the
    // loading spinner. The auth library's own signInImpl does exactly this via
    // the internal auth:store mutation (type "signIn"), creating an
    // authSessions row and issuing access + refresh tokens. The string path
    // mirrors the library's callSignIn and avoids an import cycle.
    //
    // The caller's own session (if this device still carries one from a
    // previous account) is replaced, never reused: the library deletes the
    // incoming session and mints a new one bound to THIS user id. The login is
    // decided entirely by the credentials in this request.
    let session: any = null;
    try {
      session = await ctx.runMutation("auth:store" as any, {
        args: {
          type: "signIn",
          userId: (resolved ?? u)._id,
          generateTokens: true,
        },
      });
    } catch (err) {
      console.error("[verifyLogin] session creation failed:", err);
    }

    const tokens = (session as any)?.tokens ?? null;
    if (!tokens?.token) {
      // The password WAS correct — saying otherwise is the one thing that must
      // never happen, because it sends the user round the "wrong password /
      // account broken" loop instead of the real fix (retry).
      return {
        success: false,
        code: "session_failed",
        error:
          "Your password is correct, but we couldn't start your session. Please try signing in again.",
      };
    }

    return {
      success: true,
      userId: (resolved ?? u)._id,
      email: (resolved ?? u).email,
      name: (resolved ?? u).name,
      role: finalRole,
      pendingRole:
        typeof (resolved ?? u).pendingRole === "string" && (resolved ?? u).pendingRole
          ? (resolved ?? u).pendingRole
          : null,
      tokens,
    };
  },
});

function inferRole(user: any): string | null {
  if (typeof user.role === "string" && user.role) return user.role;
  if (typeof user.email === "string" && user.email === ADMIN_EMAIL) return "admin";
  if (typeof user.email === "string" && user.email === process.env.ADMIN_EMAIL) return "admin";
  if (typeof user.businessName === "string" && user.businessName) return "seller";
  // NO default role: a real account without a role or business name stays
  // role-less. The caller keeps it pending until onboarding assigns one.
  return null;
}

/**
 * Create or sync a Nexora user profile after authentication.
 * This is the authoritative path that links an auth identity to persistent role.
 */
/**
 * Post-activation side effects shared by the frictionless signup path and
 * completeVerification: referral hooks + a welcome notification. Best-effort —
 * a hook failure must never block account activation.
 */
async function activateNewUser(
  ctx: MutationCtx,
  user: { _id: Id<"users">; name?: string; role?: string },
  finalRole: string,
) {
  try {
    await ctx.runMutation(internal.referral.internalOnUserVerified, { userId: user._id });
    await ctx.runMutation(internal.referral.internalOnUserActivated, { userId: user._id, role: finalRole });
  } catch (err) {
    console.error("[referral] activation hook failed:", err);
  }
  await ctx.db.insert("notifications", {
    userId: user._id,
    type: "account",
    title: "Account verified",
    message: `Your ${finalRole} account is fully verified. Welcome to Nexora!`,
    read: false,
    link: "/",
    createdAt: Date.now(),
  });
}

export const ensureUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    businessName: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Merge duplicate rows for this identity email first so the profile sync
    // lands on the canonical account, not an empty duplicate.
    if (typeof identity.email === "string" && identity.email.includes("@")) {
      await mergeDuplicateAccountsByEmail(ctx, identity.email);
    }

    let user = await getSessionUser(ctx);

    // Password-auth sessions may not carry an email claim in their identity
    // token; fall back to the session record's own email for duplicate
    // merging so the canonical account still gets repaired and promoted.
    const sessionEmail = typeof (user as any)?.email === "string" ? (user as any).email : undefined;
    if (typeof sessionEmail === "string" && sessionEmail.includes("@")) {
      await mergeDuplicateAccountsByEmail(ctx, sessionEmail);
      user = await getSessionUser(ctx);
    }

    const existingBusinessName =
      user && typeof (user as any).businessName === "string" ? (user as any).businessName : undefined;
    const existingRole =
      user && typeof (user as any).role === "string" ? (user as any).role : undefined;

    const targetRole = resolveRole(
      identity.email,
      typeof args.role === "string" ? args.role : undefined,
      existingRole,
      typeof args.businessName === "string" ? args.businessName : existingBusinessName,
    );

    const incomingPassword = typeof (args as any).password === "string" ? (args as any).password.trim() : "";
    const incomingPasswordHash =
      incomingPassword.length > 0 ? await hashStoredPassword(incomingPassword) : undefined;

    // Phone normalization: every signup/onboarding path stores the canonical
    // 2547XXXXXXXX form so downstream gates all agree on what "valid" means.
    const normalizedPhone = normalizePhoneOrKeep(args.phone);

    // A verified email is the hard proof of registration on every auth path
    // (email-OTP sign-up, password sign-up, Google) — the identity only exists
    // after the code was confirmed. When name + phone are also present (the
    // signup form collects all three), activation is frictionless: assign the
    // role here instead of walling the user behind a second "complete your
    // verification" screen. completeVerification stays as the repair path for
    // accounts that slip through with missing data.
    const verifiedEmail = typeof identity.email === "string" && identity.email.includes("@");
    const resolvedPhone =
      typeof normalizedPhone === "string" && normalizedPhone.trim()
        ? normalizedPhone
        : user && typeof (user as any).phone === "string"
        ? (user as any).phone
        : undefined;
    const profileComplete =
      verifiedEmail &&
      !!(typeof args.name === "string" && args.name.trim()) &&
      !!(typeof resolvedPhone === "string" && resolvedPhone.replace(/[^0-9]/g, "").length >= 9);

    // Role-specific registration data must ALSO be on file before an account
    // activates without the onboarding gate: a seller needs store name +
    // county/town, an employer a company name, providers/drivers a service
    // area. The signup forms don't collect county/town, so those roles finish
    // registration through the RoleRouter gate (which collects exactly these
    // fields) — registration is respective to the chosen role. Buyers,
    // freelancers and creators have no extra fields and activate as before.
    const roleDataComplete = (() => {
      if (!targetRole) return false;
      const effective = {
        county: typeof (user as any)?.county === "string" ? (user as any).county : "",
        town: typeof (user as any)?.town === "string" ? (user as any).town : "",
        businessName:
          typeof args.businessName === "string" && args.businessName.trim()
            ? args.businessName
            : typeof (user as any)?.businessName === "string"
            ? (user as any).businessName
            : "",
      };
      return roleSpecificRequirements(effective, targetRole).every((r) => r.met);
    })();

    if (!user) {
      // New accounts start PENDING with no role: no panel access until the
      // registration/verification process completes (see completeVerification).
      // The requested role is held in pendingRole until then.
      // EXCEPTIONS: the platform owner email is always created admin + active,
      // and a signup whose form already supplied name + phone (plus the
      // verified email) activates immediately — no second wall to climb.
      // A role must exist before activation — there is NO default role, so a
      // signup that never picked one stays pending until verification.
      const activateNow =
        identity.email === ADMIN_EMAIL ||
        (profileComplete && roleDataComplete && !!targetRole);
      user = await ctx.db.insert("users", {
        name: args.name || identity.name || identity.email?.split("@")[0] || "User",
        email: identity.email,
        phone: normalizedPhone,
        role: (activateNow && targetRole ? targetRole : undefined) as any,
        pendingRole: activateNow ? undefined : targetRole ?? undefined,
        accountStatus: (activateNow ? "active" : "pending") as any,
        passwordHash: incomingPasswordHash,
        businessName: typeof args.businessName === "string" ? args.businessName : undefined,
      }) as any;
      if (activateNow && targetRole && identity.email !== ADMIN_EMAIL) {
        await activateNewUser(ctx, user as any, targetRole);
      }
    } else {
      // A profile sync is NOT a password-change channel.
      //
      // It used to overwrite the stored hash whenever the caller passed ANY
      // `password` string that did not match — silently, with no proof of the
      // current password. The account kept working (its session was already
      // valid), so the damage only surfaced at the NEXT login: "I signed in
      // fine, signed out, and now my correct password is rejected." That is
      // the whole failure: the form's password field (Auth.tsx passes the
      // sign-up form state on the post-sign-in sync) became the account's
      // credential without anyone choosing it.
      //
      // Here we only CREATE the first password for an account that has none.
      // Changing an existing one goes through the audited channels —
      // resetPassword (emailed code) and updatePassword (current password) —
      // so no verification is weakened by this.
      const existingPasswordHash = (user as any).passwordHash;
      if (shouldCreateInitialPasswordHash(existingPasswordHash, incomingPassword)) {
        await ctx.db.patch((user as any)._id, { passwordHash: incomingPasswordHash });
      }
      const u = user as any;

      // Platform owner: always force admin + active, bypassing the pending
      // gate entirely (fixes stale buyer/pending records from older flows).
      // Accept the record's own email too: password sessions may lack the
      // identity email claim on production.
      if (identity.email === ADMIN_EMAIL || u.email === ADMIN_EMAIL) {
        if (u.role !== "admin" || u.accountStatus !== "active") {
          await ctx.db.patch(u._id, {
            role: "admin" as any,
            accountStatus: "active" as any,
            pendingRole: undefined,
          });
        }
        await ctx.db.patch(u._id, { lastActivityAt: Date.now() });
        user = (await ctx.db.get(u._id)) as any;
        return { userId: (user as any)._id, role: "admin" as any };
      }

      if (args.name !== undefined && u.name !== args.name) {
        await ctx.db.patch(u._id, { name: args.name });
      }
      // Store the normalized form when the input is a recognizable format;
      // never wipe an existing phone just because this sync carried no phone.
      if (
        typeof args.phone === "string" &&
        args.phone.trim().length > 0 &&
        typeof normalizedPhone === "string" &&
        normalizedPhone.length > 0 &&
        u.phone !== normalizedPhone
      ) {
        await ctx.db.patch(u._id, { phone: normalizedPhone });
      }
      if (args.businessName !== undefined && u.businessName !== args.businessName) {
        await ctx.db.patch(u._id, { businessName: args.businessName });
      }

      // Role changes only apply through the verification gate. A pending
      // account keeps its pendingRole (updated if the user re-submits); an
      // active account keeps its assigned role unless admin action changes it.
      if ((u as any).accountStatus !== "active") {
        if (profileComplete && roleDataComplete && targetRole) {
          // Everything the verification gate asks for is already proven
          // (verified email + name + phone) — activate now instead of
          // bouncing the user through the second verification screen. This
          // is what un-sticks provider signups stranded with no role.
          await ctx.db.patch(u._id, {
            role: targetRole,
            accountStatus: "active" as any,
            pendingRole: undefined,
            ...(typeof resolvedPhone === "string" && u.phone !== resolvedPhone
              ? { phone: resolvedPhone }
              : {}),
          });
          await activateNewUser(ctx, u, targetRole);
          user = (await ctx.db.get(u._id)) as any;
          return { userId: (user as any)._id, role: targetRole as any };
        }
        // Still pending — record the requested role and stay unverified.
        // Pending users CAN change their requested role; active users cannot
        // (the role is locked once assigned).
        // CRITICAL: a role-less sync must never OVERWRITE the account type
        // the user already requested. Two such syncs exist: the use-auth
        // self-heal fires ensureUserProfile({}) with no args on every page
        // load, and signing IN through a role-specific form (e.g. the buyer
        // checkout card) sends that FORM's role as args.role. Overwriting
        // pendingRole here is what erased "seller" down to "buyer" and sent
        // every role to the buyer panel after login. Fill it only when no
        // pendingRole exists yet; an active account's role is locked anyway.
        if (
          typeof args.role === "string" &&
          args.role &&
          !u.pendingRole &&
          (targetRole ?? undefined) !== u.pendingRole
        ) {
          await ctx.db.patch(u._id, { pendingRole: targetRole ?? undefined });
        }
      } else if (!u.role && targetRole) {
        // Active legacy account missing a role entirely: assign the resolved
        // one. An account that ALREADY has a role is NEVER overwritten here.
        await ctx.db.patch(u._id, { role: targetRole });
      }

      await ctx.db.patch(u._id, { lastActivityAt: Date.now() });
      user = await ctx.db.get(u._id) as any;
    }

    const freshUser = user as any;
    return { userId: freshUser._id, role: (freshUser?.role ?? null) as any };
  },
});

/**
 * Internal (CLI/server only): backfill the verification gate for accounts
 * created before it existed. Any real account that already has a role is
 * marked active (they were verified under the old flow); accounts with no
 * role stay pending so they complete onboarding.
 */
export const backfillAccountStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let activated = 0;
    let keptPending = 0;
    for (const u of users) {
      const anyU = u as any;
      if (anyU.accountStatus === "active") continue;
      if (typeof anyU.role === "string" && anyU.role) {
        await ctx.db.patch(u._id, { accountStatus: "active" as any });
        activated++;
      } else {
        // NO default role: accounts without a role stay pending with none
        // requested. They choose their role when completing onboarding.
        keptPending++;
      }
    }
    return { activated, keptPending };
  },
});

/**
 * ─── VERIFICATION GATE ───────────────────────────────────────────────────
 *
 * A user gets NO role (and no panel access) until registration and
 * verification are fully complete and approved. completeVerification checks
 * every requirement for the requested role and only then assigns it:
 *  - buyer/seller/freelancer/employer: real email + name + phone on file
 *  - admin: platform admin email only (never user-requested)
 *
 * When all checks pass the pendingRole is copied into role and accountStatus
 * flips to "active" — the frontend then routes to the correct panel.
 */

/**
 * Role-specific registration requirements. EVERY role proves email + name +
 * phone + chosen account type; these rows add what THAT role needs to run:
 *  - seller: a store/business name (what customers see) + county & town for
 *    delivery and pickup;
 *  - employer: a company / organisation name;
 *  - service_provider & driver: the county & town they operate in.
 * The onboarding screen renders an input for every unmet row and
 * completeVerification re-checks them server-side before activation.
 */
function roleSpecificRequirements(
  u: any,
  effectiveRole: string,
): Array<{ key: string; label: string; met: boolean; detail?: string }> {
  const county = typeof u.county === "string" ? u.county.trim() : "";
  const town = typeof u.town === "string" ? u.town.trim() : "";
  const businessName = typeof u.businessName === "string" ? u.businessName.trim() : "";

  if (effectiveRole === "seller") {
    const bizOk = businessName.length >= 2;
    const locOk = county.length > 0 && town.length > 0;
    return [
      {
        key: "seller_business",
        label: "Business / store name",
        met: bizOk,
        detail: bizOk ? undefined : "Open the field above and enter the store name customers will see.",
      },
      {
        key: "seller_location",
        label: "County & town (delivery)",
        met: locOk,
        detail: locOk ? undefined : "Open the fields above and pick your county and town.",
      },
    ];
  }
  if (effectiveRole === "employer") {
    // ── Part 3: an employer is NOT a company ──
    // The ONLY employer requirement is declaring WHO is hiring:
    // Individual (no company), Business, or Organization/NGO. Company name
    // stays optional and is only ever a display nicety — "Jane needs a house
    // help" must never be forced into a company-registration workflow.
    const hasType =
      u.employerType === "individual" ||
      u.employerType === "business" ||
      u.employerType === "organization";
    return [
      {
        key: "employer_type",
        label: "Who is hiring? (Individual, Business or Organization)",
        met: hasType,
        detail: hasType
          ? undefined
          : "Pick Individual if you are hiring for yourself or your household — no company needed.",
      },
    ];
  }
  if (effectiveRole === "service_provider" || effectiveRole === "driver") {
    const locOk = county.length > 0 && town.length > 0;
    return [
      {
        key: "provider_location",
        label: effectiveRole === "driver" ? "County & town (where you drive)" : "County & town (service area)",
        met: locOk,
        detail: locOk ? undefined : "Open the fields above and pick your county and town.",
      },
    ];
  }
  return [];
}

export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return { authenticated: false };

    const u = user as any;
    const hasEmail = typeof u.email === "string" && u.email.includes("@");
    const hasName = typeof u.name === "string" && u.name.trim().length > 0;
    // MIRROR the authoritative registration gate (kenyanPhoneError in
    // completeVerification). A stored number that is >= 9 digits but not a
    // valid Kenyan mobile (a landline, a malformed paste, a foreign number)
    // must NOT report "met" — otherwise the onboarding screen hides the phone
    // input while "Finish verification" keeps refusing, and the account can
    // never complete registration (the exact seller deadlock).
    const phoneMet =
      typeof u.phone === "string" &&
      u.phone.trim().length > 0 &&
      kenyanPhoneError(u.phone) === null;

    const requestedRole =
      typeof u.pendingRole === "string" && u.pendingRole
        ? u.pendingRole
        : typeof u.role === "string" && u.role
          ? u.role
          : null;

    // Universal steps every role completes, then the role-specific ones so
    // registration asks exactly what the chosen account type needs.
    const requirements: Array<{ key: string; label: string; met: boolean; detail?: string }> = [
      { key: "email", label: "Verified email account", met: hasEmail },
      { key: "name", label: "Full name on profile", met: hasName },
      {
        key: "phone",
        label: "Phone number (M-Pesa & delivery)",
        met: phoneMet,
        // Tell the seller exactly why their stored number is rejected.
        detail: !phoneMet && typeof u.phone === "string" && u.phone.trim().length > 0
          ? kenyanPhoneError(u.phone) ?? undefined
          : undefined,
      },
      { key: "role", label: "Chosen account type", met: !!requestedRole },
      ...(typeof requestedRole === "string" && requestedRole
        ? roleSpecificRequirements(u, requestedRole)
        : []),
    ];
    const isComplete = requirements.every((r) => r.met);

    return {
      authenticated: true,
      accountStatus: (u.accountStatus as string) || (u.role ? "active" : "pending"),
      requestedRole,
      requirements,
      isComplete,
      profile: {
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        businessName: u.businessName || "",
        county: u.county || "",
        town: u.town || "",
        employerType: u.employerType || "",
        companyName: u.companyName || "",
        employerDisplay: u.employerDisplay || "",
      },
    };
  },
});

/**
 * Set the pending role from the onboarding screen. Called by the verification
 * gate when a role-less pending account picks its account type — the role is
 * stored as pendingRole and only becomes real through completeVerification.
 */
export const setPendingRole = mutation({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");
    const u = user as any;

    // Active accounts with a role are LOCKED — role changes go through admin.
    if (u.accountStatus === "active" && typeof u.role === "string" && u.role) {
      return { success: false, role: u.role };
    }

    // Platform roles only — admin is never self-assigned.
    const allowed = ["buyer", "seller", "freelancer", "employer", "creator", "service_provider", "driver"];
    if (!allowed.includes(args.role)) {
      throw new ConvexError("Unknown account type.");
    }

    await ctx.db.patch(u._id, { pendingRole: args.role as any });
    return { success: true, role: args.role };
  },
});

/**
 * Finish verification: assign the pending role and activate the account once
 * every requirement for that role is met. Called by the onboarding page after
 * the user completes their profile.
 */
export const completeVerification = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    county: v.optional(v.string()),
    town: v.optional(v.string()),
    // Employer identity (Part 3). `employerType` is the only REQUIRED employer
    // field; companyName stays optional so an individual never has to invent
    // a company.
    employerType: v.optional(v.union(v.literal("individual"), v.literal("business"), v.literal("organization"))),
    companyName: v.optional(v.string()),
    employerDisplay: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("User not found");

    const u = user as any;

    // Apply any profile updates submitted with the completion step. Phones are
    // normalized (07… / +254… / 00254… → 2547XXXXXXXX) before being stored so
    // M-Pesa, wallet and delivery flows all see one canonical form.
    if (typeof args.name === "string" && args.name.trim() && args.name !== u.name) {
      await ctx.db.patch(u._id, { name: args.name.trim() });
    }
    const normalizedIncoming = normalizePhoneOrKeep(args.phone);
    if (normalizedIncoming && normalizedIncoming !== u.phone) {
      await ctx.db.patch(u._id, { phone: normalizedIncoming });
    }
    // Role-specific registration fields: business/store name (seller,
    // employer) and the Kenya county/town (seller delivery, provider and
    // driver service area). Trimmed; only written when the caller sent them.
    if (typeof args.businessName === "string" && args.businessName.trim()) {
      await ctx.db.patch(u._id, { businessName: args.businessName.trim() });
    }
    if (typeof args.county === "string" && args.county.trim()) {
      await ctx.db.patch(u._id, { county: args.county.trim() });
    }
    if (typeof args.town === "string" && args.town.trim()) {
      await ctx.db.patch(u._id, { town: args.town.trim() });
    }
    if (
      args.employerType === "individual" ||
      args.employerType === "business" ||
      args.employerType === "organization"
    ) {
      await ctx.db.patch(u._id, { employerType: args.employerType });
      // An individual employer must never keep a stale company label.
      if (args.employerType === "individual") {
        await ctx.db.patch(u._id, { companyName: undefined });
      }
    }
    if (typeof args.companyName === "string" && args.companyName.trim()) {
      await ctx.db.patch(u._id, { companyName: args.companyName.trim() });
    }
    if (typeof args.employerDisplay === "string" && args.employerDisplay.trim()) {
      await ctx.db.patch(u._id, { employerDisplay: args.employerDisplay.trim() });
    }

    const fresh = (await ctx.db.get(u._id)) as any;

    const hasEmail = typeof fresh.email === "string" && fresh.email.includes("@");
    const hasName = typeof fresh.name === "string" && fresh.name.trim().length > 0;
    const hasPhone =
      typeof fresh.phone === "string" && fresh.phone.trim().length > 0;

    const requestedRole =
      typeof fresh.pendingRole === "string" && fresh.pendingRole
        ? fresh.pendingRole
        : typeof fresh.role === "string" && fresh.role
          ? fresh.role
          : null;

    if (!hasEmail) {
      throw new ConvexError("Verify your email before completing registration.");
    }
    if (!hasName) {
      throw new ConvexError("Add your full name to complete registration.");
    }
    if (!hasPhone) {
      throw new ConvexError("Add your phone number to complete registration.");
    }
    if (!requestedRole) {
      throw new ConvexError("Choose your account type to complete registration.");
    }
    // Strict Kenyan mobile validation — fake/malformed numbers can never
    // complete registration (server is authoritative; the client mirrors it
    // via src/lib/kenyan-phone.ts — same rules, so the onboarding screen
    // surfaces the same error with an editable input instead of a dead end).
    const phoneProblem = kenyanPhoneError(String(fresh.phone ?? ""));
    if (phoneProblem) {
      throw new ConvexError(
        `${phoneProblem} Open the phone field above and correct your number.`,
      );
    }

    // ── Role-specific requirements (mirror getOnboardingStatus) ──
    // The server is authoritative: even if a tampered client hid these steps,
    // activation is refused until the chosen role's own data is on file.
    for (const req of roleSpecificRequirements(fresh, requestedRole)) {
      if (!req.met) {
        throw new ConvexError(
          req.detail || `Complete the "${req.label}" step to finish registration.`,
        );
      }
    }

    // Admin role is never self-assigned here; the admin email path handles it.
    // allowlist: only platform roles can ever be completed here — admin is
    // assigned by the owner-email path, never requested by a client.
    const SELF_SERVICE_ROLES = ["buyer", "seller", "freelancer", "employer", "creator", "service_provider", "driver"] as const;
    const finalRole =
      typeof requestedRole === "string" && (SELF_SERVICE_ROLES as readonly string[]).includes(requestedRole)
        ? (requestedRole as (typeof SELF_SERVICE_ROLES)[number])
        : null;
    if (!finalRole) {
      throw new ConvexError("Choose a valid account type to complete registration.");
    }

    await ctx.db.patch(u._id, {
      role: finalRole,
      accountStatus: "active" as any,
      pendingRole: undefined,
    });

    // ── Referral program hooks: the referred user has passed verification ──
    // and is now active with their role. These are best-effort — a referral
    // hiccup must never block account activation.
    try {
      await ctx.runMutation(internal.referral.internalOnUserVerified, { userId: u._id });
      await ctx.runMutation(internal.referral.internalOnUserActivated, { userId: u._id, role: finalRole });
    } catch (err) {
      console.error("[referral] verification/activation hook failed:", err);
    }

    await ctx.db.insert("notifications", {
      userId: u._id,
      type: "account",
      title: "Account verified",
      message: `Your ${finalRole} account is fully verified. Welcome to Nexora!`,
      read: false,
      link: "/",
      createdAt: Date.now(),
    });

    return { success: true, role: finalRole };
  },
});

/**
 * ─── FORGOT / RESET PASSWORD ───────────────────────────────────────────────
 *
 * Two-step, code-based reset that reuses the platform's email OTP sender:
 *
 * 1. requestPasswordReset(email) — generates a 6-digit code, stores ONLY its
 *    PBKDF2 hash (never the plaintext), and emails it. Always returns success
 *    so callers cannot probe which emails have accounts.
 * 2. resetPassword({ email, code, newPassword }) — verifies the code against
 *    the stored hash with a 5-attempt limit and 15-minute expiry, enforces the
 *    same strong-password policy as signup, then replaces the account's
 *    password hash and deletes the code.
 *
 * The reset code is sent with the same freebuff email service the auth OTP
 * flow uses, so no extra API key is required.
 */
export const requestPasswordReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) {
      return { success: true }; // uniform response — do not leak validity
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    // Uniform success even when the account doesn't exist (anti-enumeration).
    if (!user) return { success: true };

    // Generate a 6-digit code and store only its hash.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await hashStoredPassword(code);

    // One active code per email: replace any previous one.
    const previous = await ctx.db
      .query("passwordResetCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const p of previous) {
      await ctx.db.delete(p._id);
    }

    await ctx.db.insert("passwordResetCodes", {
      email,
      codeHash,
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0,
      createdAt: Date.now(),
    });

    // Send the code via the same email service used by auth OTP.
    try {
      await fetch("https://auth.freebuff.app/send_otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "fb_email_2crN1hqIArZP2bEfvjp5Qik4",
        },
        body: JSON.stringify({
          to: email,
          otp: code,
          appName: process.env.VLY_APP_NAME || "Nexora Market",
        }),
      });
    } catch {
      // Do not reveal send failures to the caller (anti-enumeration).
    }

    return { success: true };
  },
});

// ─── BUYER VERIFICATION (purchase-gated) ───────────────────────────────────

/**
 * A buyer's profile counts as FULLY VERIFIED only after one complete
 * purchase — an escrow that actually RELEASED (buyer confirmed delivery).
 * Signup and KYC alone prove identity, not trustworthy buying behaviour.
 */
export async function hasCompletedPurchase(ctx: any, userId: string): Promise<boolean> {
  const escrows = await ctx.db
    .query("escrows")
    .withIndex("by_buyer", (q: any) => q.eq("buyerId", userId))
    .collect();
  return escrows.some((e: any) => e.status === "released" || e.status === "completed");
}

/**
 * Buyer verification status for the signed-in user (or any user if the
 * caller is an admin). Drives the "Verified Buyer" badge and the
 * purchase-verification hint on the buyer profile.
 */
export const getBuyerVerification = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let targetId: string | null = null;
    if (args.userId) {
      const viewer = await getSessionUser(ctx);
      if (viewer && (viewer as any).role === "admin") targetId = args.userId;
    }
    if (!targetId) {
      const me = await getSessionUser(ctx);
      if (!me) return null;
      targetId = me._id;
    }
    const escrows = await ctx.db
      .query("escrows")
      .withIndex("by_buyer", (q: any) => q.eq("buyerId", targetId))
      .collect();
    const completed = escrows.filter(
      (e: any) => e.status === "released" || e.status === "completed",
    );
    return {
      completePurchases: completed.length,
      buyerVerified: completed.length >= 1,
      firstPurchaseAt:
        completed.length > 0
          ? Math.min(...completed.map((e: any) => (e as any).releasedAt ?? e._creationTime))
          : undefined,
    };
  },
});

/**
 * Complete a password reset: verify the emailed code and set a new password.
 * Enforces the same strong-password policy as signup, limits attempts to 5,
 * and expires codes after 15 minutes.
 */
export const resetPassword = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    if (!isStrongPassword(args.newPassword)) {
      throw new ConvexError(
        "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and symbol."
      );
    }

    const record = await ctx.db
      .query("passwordResetCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!record) {
      throw new ConvexError("Invalid or expired code. Please request a new one.");
    }
    if (record.expiresAt < Date.now()) {
      await ctx.db.delete(record._id);
      throw new ConvexError("This code has expired. Please request a new one.");
    }
    if (record.attempts >= 5) {
      await ctx.db.delete(record._id);
      throw new ConvexError("Too many attempts. Please request a new code.");
    }

    const valid = await verifyStoredPasswordHash(record.codeHash, args.code.trim());
    if (!valid) {
      await ctx.db.patch(record._id, { attempts: record.attempts + 1 });
      throw new ConvexError("Invalid code. Please check and try again.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (!user) {
      await ctx.db.delete(record._id);
      throw new ConvexError("Account not found.");
    }

    await ctx.db.patch(user._id, {
      passwordHash: await hashStoredPassword(args.newPassword),
    });
    await ctx.db.delete(record._id);

    // Invalidate every existing session for this account so any device that
    // holds an old token is signed out after a password reset.
    try {
      const sessions = await ctx.db.query("authSessions").collect();
      for (const s of sessions) {
        if ((s as any).userId === user._id) {
          await ctx.db.delete(s._id);
        }
      }
    } catch {
      // authSessions table may not be directly queryable in all deployments.
    }

    return { success: true };
  },
});

/**
 * Change password with strong policy enforcement.
 */
export const updatePassword = mutation({
  args: {
    currentPassword: v.optional(v.string()),
    newPassword: v.string(),
    confirmPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isStrongPassword(args.newPassword)) {
      throw new ConvexError(
        "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and symbol."
      );
    }

    if (args.confirmPassword !== args.newPassword) {
      throw new ConvexError("Passwords do not match.");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await getSessionUser(ctx);

    if (!user) throw new ConvexError("User not found");

    const u = user as any;

    if (
      args.currentPassword &&
      typeof u.passwordHash === "string" &&
      !(await verifyStoredPasswordHash(u.passwordHash, args.currentPassword))
    ) {
      throw new ConvexError("Current password is incorrect.");
    }

    await ctx.db.patch(u._id, { passwordHash: await hashStoredPassword(args.newPassword) });
    return { success: true };
  },
});

function isStrongPassword(password: string): boolean {
  if (typeof password !== "string") return false;
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  const normalized = password.toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) return false;
  return true;
}

const COMMON_PASSWORDS = new Set([
  "password",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "abc123",
  "letmein",
  "welcome",
  "admin123",
  "nexora",
  "market",
  "seller",
  "buyer",
  "escrow",
  "mpesa",
  "junior",
  "senior",
  "test123",
  "test1234",
]);

async function hashPasswordForStorage(password: string): Promise<string> {
  return hashStoredPassword(password);
}

/** Auto-promote first admin — anyone signing up with this email gets admin role.
 * Also ensures new users get proper role assignment on signup. */
export const checkAndPromoteAdmin = mutation({
  args: {
    role: v.optional(v.string()),
    phone: v.optional(v.string()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // ── ADMIN-ONLY PROMOTION ──────────────────────────────────────────
    // This mutation is called exclusively from the admin login OTP step.
    // It must NEVER create or modify records for non-admin emails: the old
    // version inserted a stub user (name = email prefix, no role) for ANY
    // email that completed an OTP at the admin gate, which silently flooded
    // the database with permanent "no role, pending" accounts. Everyone who
    // is not the platform owner is left completely untouched here.
    if (identity.email !== ADMIN_EMAIL) {
      return { promoted: false, message: "Not an admin email" };
    }

    let user = await getSessionUser(ctx);

    // Owner account missing entirely (fresh deployment): create it directly
    // as admin + active. Only ever for ADMIN_EMAIL.
    if (!user) {
      const name = identity.name || "Nexora Admin";
      user = await ctx.db.insert("users", {
        name,
        email: identity.email,
        role: "admin" as any,
        accountStatus: "active" as any,
        kycStatus: "not_started",
        lastLoginAt: Date.now(),
        lastActivityAt: Date.now(),
        joinedAt: Date.now(),
      }) as any;
      return { promoted: true, message: "Admin account ready" };
    }

    // Existing owner record: force admin + active, clear any stale gate.
    const u = user as any;
    const ownerPatch: Record<string, any> = {};
    if (u.role !== "admin") ownerPatch.role = "admin" as const;
    if (u.accountStatus !== "active") {
      ownerPatch.accountStatus = "active" as const;
      ownerPatch.pendingRole = undefined;
    }
    if (Object.keys(ownerPatch).length > 0) {
      await ctx.db.patch(u._id, ownerPatch);
    }
    await ctx.db.patch(u._id, { lastActivityAt: Date.now() });
    return { promoted: true, message: "You have been promoted to admin!" };
  },
});

/**
 * Promote any user to admin.
 * SECURITY: Only callable by the hardcoded admin email OR an existing admin.
 * The target is resolved from the authenticated session (never a raw
 * client-supplied email), so a stale/mistyped email can never make the
 * promotion throw "User not found".
 */
export const promoteToAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Resolve the caller's user record from the session itself
    const caller = await getSessionUser(ctx);

    if (!caller) throw new ConvexError("User not found");

    // Allow if the caller is already an admin, or if it's the hardcoded admin email
    // (the email itself is the ultimate authority — even if DB role is missing)
    const callerIsAdmin = caller.role === "admin" || identity.email === ADMIN_EMAIL;
    if (!callerIsAdmin) {
      throw new ConvexError("Unauthorized: only admins can promote users");
    }

    const callerRole = (caller as any).role as string | undefined;
    if (callerRole !== "admin") {
      await ctx.db.patch(caller._id, { role: "admin" as const });
    }
    return { success: true, userId: caller._id };
  },
});

/**
 * One-shot admin bootstrap used by the admin route guard.
 * Self-promotes the platform owner (ADMIN_EMAIL) if needed and reports the
 * authoritative admin state for the session. Safe to call repeatedly.
 */
export const ensureAdminAccess = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { isAdmin: false, authenticated: false };

    // Merge duplicate rows for this identity first so the session binds to the
    // canonical record — a stale duplicate must never receive the promotion.
    if (typeof identity.email === "string" && identity.email.includes("@")) {
      await mergeDuplicateAccountsByEmail(ctx, identity.email);
    }

    let caller = await getSessionUser(ctx);
    if (!caller) return { isAdmin: false, authenticated: true };

    // Owner detection: prefer the identity token's email claim, but also accept
    // the session record's own email — password-auth sessions on production may
    // not carry the email claim, which previously left prod with zero admins
    // (the gate passed via the record email but no query ever promoted the
    // record, so every admin query threw "Server Error").
    const callerEmail = (caller as any).email;
    const isOwnerCaller =
      identity.email === ADMIN_EMAIL ||
      (typeof callerEmail === "string" && callerEmail === ADMIN_EMAIL);

    if (isOwnerCaller) {
      const ownerPatch: Record<string, any> = {};
      if (caller.role !== "admin") ownerPatch.role = "admin" as const;
      // Also clear the verification gate so a stale pending record can never
      // keep the owner out of the panel.
      if ((caller as any).accountStatus !== "active") {
        ownerPatch.accountStatus = "active" as const;
        ownerPatch.pendingRole = undefined;
      }
      if (Object.keys(ownerPatch).length > 0) {
        await ctx.db.patch(caller._id, ownerPatch);
      }
    }

    const fresh = (await ctx.db.get(caller._id)) as any;
    return { isAdmin: fresh?.role === "admin", authenticated: true };
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const user = await ctx.db.get(userId);
    if (!user) return false;
    if (user.role === "admin") return true;
    // Owner fallback: the platform owner email is ALWAYS an admin, even while
    // a stale production record still carries another role. The admin gate can
    // never lock the owner out (the record itself is repaired separately).
    return typeof user.email === "string" && user.email === ADMIN_EMAIL;
  },
});

export const getAdminUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await getSessionUser(ctx);
    if (!user) return null;
    return { _id: user._id, email: user.email, name: user.name, role: user.role };
  },
});

/** Update current user profile */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    county: v.optional(v.string()),
    town: v.optional(v.string()),
    storeDescription: v.optional(v.string()),
    storeWebsite: v.optional(v.string()),
    storeHours: v.optional(v.string()),
    // Profile icon/avatar: the storage URL of the uploaded file, plus the
    // storage id kept alongside so the previous file can be deleted on replace.
    image: v.optional(v.string()),
    imageStorageId: v.optional(v.string()),
    // Profile name: the public name shown across the marketplace. The legal
    // registration name is kept untouched in `legalName`.
    profileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("User not found");

    const updates: Record<string, any> = {};
    // Phones: store the canonical 2547XXXXXXXX form whenever the input is a
    // recognizable Kenyan mobile; otherwise keep the raw trimmed input (the
    // registration gate will still refuse non-Kenyan numbers).
    const profilePhone = normalizePhoneOrKeep(args.phone);
    if (profilePhone !== undefined) updates.phone = profilePhone;
    if (args.name !== undefined) updates.name = args.name;
    if (args.whatsapp !== undefined) updates.whatsapp = args.whatsapp;
    if (args.county !== undefined) updates.county = args.county;
    if (args.town !== undefined) updates.town = args.town;
    if (args.storeDescription !== undefined) updates.storeDescription = args.storeDescription;
    if (args.storeWebsite !== undefined) updates.storeWebsite = args.storeWebsite;
    if (args.storeHours !== undefined) updates.storeHours = args.storeHours;
    if (args.image !== undefined) updates.image = args.image;
    if (args.imageStorageId !== undefined) updates.imageStorageId = args.imageStorageId;
    if (args.profileName !== undefined) {
      const trimmed = args.profileName.trim();
      if (trimmed.length < 2) throw new ConvexError("Profile name is too short.");
      // First edit: freeze the registration name as the legal name, then the
      // profile name becomes whatever the user wants to be called.
      if (!(user as any).legalName) {
        updates.legalName = (user as any).name || trimmed;
      }
      updates.name = trimmed;
      updates.profileName = trimmed;
    }

    // Replacing the avatar: clean up the previous uploaded file so storage
    // doesn't accumulate orphaned objects. Google-OAuth images (remote URLs)
    // have no storage id and are simply overwritten.
    if (args.imageStorageId !== undefined) {
      const old = (user as any).imageStorageId as string | undefined;
      if (old && old !== args.imageStorageId) {
        try { await ctx.storage.delete(old as any); } catch { /* already gone */ }
      }
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return { success: true };
  },
});

/** Upload URL for a profile icon — available to every signed-in user
 * (buyers, sellers, freelancers, employers, AI taskers, creators, admins). */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/** Attach an uploaded avatar file to the caller's account. Resolves the
 * storage URL so every existing `user.image` render keeps working unchanged. */
export const setAvatarFromUpload = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("User not found");

    const url = await ctx.storage.getUrl(args.storageId as any);
    if (!url) throw new ConvexError("Upload not found — try again.");

    const old = (user as any).imageStorageId as string | undefined;
    if (old && old !== args.storageId) {
      try { await ctx.storage.delete(old as any); } catch { /* already gone */ }
    }

    await ctx.db.patch(user._id, { image: url, imageStorageId: args.storageId });
    return { success: true, image: url };
  },
});

/** Remove the custom avatar — falls back to the initial-letter placeholder. */
export const removeAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("User not found");

    const old = (user as any).imageStorageId as string | undefined;
    if (old) {
      try { await ctx.storage.delete(old as any); } catch { /* already gone */ }
    }
    await ctx.db.patch(user._id, { image: undefined, imageStorageId: undefined });
    return { success: true };
  },
});

/** Public profile for a seller's storefront page. Returns ONLY the fields a
 * stranger may see — never contact details, wallet balances, or auth data. */
export const getPublicProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = (await ctx.db.get(args.userId as any)) as any;
    if (!user) return null;
    return {
      _id: user._id as string,
      _creationTime: user._creationTime,
      name: (user.name as string | undefined) ?? undefined,
      businessName: (user.businessName as string | undefined) ?? undefined,
      county: (user.county as string | undefined) ?? undefined,
      town: (user.town as string | undefined) ?? undefined,
      storeDescription: (user.storeDescription as string | undefined) ?? undefined,
      storeWebsite: (user.storeWebsite as string | undefined) ?? undefined,
      storeHours: (user.storeHours as string | undefined) ?? undefined,
      kycStatus: (user.kycStatus as string | undefined) ?? undefined,
      joinedAt: (user.joinedAt as number | undefined) ?? undefined,
      reputation: (user.reputation as number | undefined) ?? undefined,
    };
  },
});

/**
 * Internal repair utility (server/CLI only — NOT callable from the client).
 * Unsticks accounts whose sign-up profile sync failed mid-flow by setting the
 * persistent role (and optionally a business name). Because this is an
 * internal mutation, app users cannot invoke it, so it cannot be used for
 * privilege escalation.
 */
/**
 * Internal repair (CLI/server only): unify a seller's accounts after the
 * broken early-auth flows split one person across two user records.
 *
 * Copies the password hash (and any missing contact fields) from the source
 * record — typically the pre-OTP anonymous account where the password was
 * actually stored — onto the email record, and moves the source record's
 * listings to the email record so the seller's products follow their
 * email + password login.
 */
export const repairSellerLogin = internalMutation({
  args: {
    fromUserId: v.id("users"),
    toEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const from = await ctx.db.get(args.fromUserId);
    if (!from) return { success: false, error: "Source user not found" };
    const to = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.toEmail))
      .first();
    if (!to) return { success: false, error: `User with email ${args.toEmail} not found` };

    const f = from as any;
    const t = to as any;
    const patch: Record<string, any> = {};

    if (typeof f.passwordHash === "string" && f.passwordHash.length > 0) {
      patch.passwordHash = f.passwordHash;
    }
    if (typeof f.phone === "string" && f.phone && !t.phone) {
      patch.phone = f.phone;
    }
    if (typeof f.county === "string" && f.county && !t.county) patch.county = f.county;
    if (typeof f.town === "string" && f.town && !t.town) patch.town = f.town;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(to._id, patch);
    }

    // Move the source account's listings to the email account.
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.fromUserId))
      .collect();
    for (const listing of listings) {
      await ctx.db.patch(listing._id, { sellerId: to._id });
    }

    const recalcActive = async (userId: string) => {
      const active = await ctx.db
        .query("listings")
        .withIndex("by_seller", (q) => q.eq("sellerId", userId))
        .filter((qq) => qq.eq(qq.field("status"), "active"))
        .collect();
      await ctx.db.patch(userId as any, { activeListings: active.length });
    };
    await recalcActive(args.fromUserId as any);
    await recalcActive(to._id as any);

    return {
      success: true,
      movedListings: listings.length,
      passwordHashCopied: typeof f.passwordHash === "string" && f.passwordHash.length > 0,
      targetUserId: to._id,
    };
  },
});

/**
 * Internal wipe (CLI/server only): remove EVERY account except the platform
 * admin, and remove every published product/listing — resetting the
 * marketplace to a clean admin-only state. Auth records (accounts, sessions,
 * pending verification codes) and all user-scoped data (notifications, wallet
 * transactions, messages, reviews, escrows, etc.) belonging to removed users
 * are deleted too.
 */
export const wipeToAdminOnly = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const allUsers = await ctx.db.query("users").collect();
    const removedUserIds = new Set<string>();
    let keptUsers = 0;
    for (const u of allUsers) {
      const rec = u as any;
      if (rec.email && String(rec.email).toLowerCase() === ADMIN_EMAIL) {
        keptUsers++;
        continue;
      }
      removedUserIds.add(u._id);
      await ctx.db.delete(u._id);
    }

    // Auth-linked records for removed users.
    const authAccounts = await ctx.db.query("authAccounts").collect();
    let authAccountsDeleted = 0;
    for (const a of authAccounts) {
      if (removedUserIds.has((a as any).userId)) {
        await ctx.db.delete(a._id);
        authAccountsDeleted++;
      }
    }
    const authSessions = await ctx.db.query("authSessions").collect();
    let authSessionsDeleted = 0;
    for (const s of authSessions) {
      if (removedUserIds.has((s as any).userId)) {
        await ctx.db.delete(s._id);
        authSessionsDeleted++;
      }
    }
    // Transient OTP codes are useless after a wipe.
    const verificationRequests = await ctx.db.query("authVerificationRequests").collect();
    for (const vr of verificationRequests) await ctx.db.delete(vr._id);

    // All published products/listings.
    const listings = await ctx.db.query("listings").collect();
    for (const l of listings) await ctx.db.delete(l._id);

    async function deleteWhereUser(tableName: string, fields: string[]): Promise<number> {
      const docs = await ctx.db.query(tableName).collect();
      let deleted = 0;
      for (const doc of docs) {
        const rec = doc as any;
        if (fields.some((f) => typeof rec[f] === "string" && removedUserIds.has(rec[f]))) {
          await ctx.db.delete(doc._id);
          deleted++;
        }
      }
      return deleted;
    }

    const cleared: Record<string, number> = {};
    const scopedTables: Array<[string, string[]]> = [
      ["notifications", ["userId"]],
      ["walletTransactions", ["userId"]],
      ["kycApplications", ["userId"]],
      ["messages", ["senderId", "receiverId"]],
      ["conversations", ["buyerId", "sellerId"]],
      ["reviews", ["buyerId", "sellerId"]],
      ["escrows", ["buyerId", "sellerId"]],
      ["disputes", ["filedBy"]],
      ["deliveries", ["driverId"]],
      ["freelanceProfiles", ["userId"]],
      ["freelanceTasks", ["employerId"]],
      ["freelanceApplications", ["freelancerId"]],
      ["freelanceProjects", ["employerId", "freelancerId"]],
      ["freelanceEarnings", ["freelancerId"]],
      ["freelanceServices", ["freelancerId"]],
      ["freelanceReviews", ["reviewerId", "revieweeId"]],
      ["freelanceMessages", ["senderId"]],
      ["jobPosts", ["posterId"]],
      ["jobApplications", ["applicantId"]],
      ["supportTickets", ["userId"]],
      ["ticketMessages", ["senderId"]],
      ["aiAuditLog", ["userId"]],
      ["fraudAlerts", ["userId"]],
    ];
    for (const [table, fields] of scopedTables) {
      cleared[table] = await deleteWhereUser(table, fields);
    }

    return {
      success: true,
      keptUsers,
      usersRemoved: removedUserIds.size,
      listingsRemoved: listings.length,
      authAccountsDeleted,
      authSessionsDeleted,
      cleared,
    };
  },
});

export const repairUserRole = internalMutation({
  args: {
    email: v.string(),
    role: v.optional(v.string()),
    businessName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    if (!user) return { success: false, error: "User not found" };

    const u = user as any;
    const patch: Record<string, any> = {};
    if (
      typeof args.role === "string" &&
      ALLOWED_ROLES.includes(args.role as AllowedRole)
    ) {
      patch.role = args.role;
    }
    if (
      typeof args.businessName === "string" &&
      args.businessName.trim().length > 0
    ) {
      patch.businessName = args.businessName.trim();
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(u._id, patch);
    }

    const fresh = (await ctx.db.get(u._id)) as any;
    return {
      success: true,
      email: fresh?.email ?? null,
      role: fresh?.role ?? null,
      businessName: fresh?.businessName ?? null,
    };
  },
});
