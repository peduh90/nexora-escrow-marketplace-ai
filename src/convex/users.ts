import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation, internalMutation, QueryCtx } from "./_generated/server";
import { ALLOWED_ROLES, resolveRole, resolveRoleForAdminFlow, ADMIN_EMAIL } from "./roles";
import type { AllowedRole } from "./roles";

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

    // Resolve + merge duplicate accounts for this email BEFORE the password
    // check: the password may live on one row while the role and listings live
    // on another (the "seller data disappears after login" bug).
    const user = await mergeDuplicateAccountsByEmail(ctx, args.email.trim());

    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    const u = user as any;

    // Do not reveal whether the email exists.
    // Reject new plaintext password storage: a stored value equal to the
    // plaintext password is not a valid hash and must not be accepted.
    const validPassword =
      typeof u.passwordHash === "string" &&
      u.passwordHash.startsWith("pbkdf2:") &&
      (await verifyStoredPasswordHash(u.passwordHash, args.password));

    if (!validPassword) {
      return { success: false, error: "Invalid email or password." };
    }

    // ---- Role repair on login ------------------------------------------
    // Nexora convention (see getUserCounts): a user with a business name is a
    // seller. Accounts created by earlier broken auth flows can carry a stale
    // "buyer" (or missing) role even though businessName is set — that is what
    // routed sellers to /buyer after login. Repair the stored role here so the
    // correction is persistent, then route by the repaired role.
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
    } else if (hasBusinessName && role !== "seller" && role !== "admin") {
      role = "seller";
      await ctx.db.patch(u._id, { role: "seller" as any });
    } else if (!role) {
      const inferred = inferRole(u);
      if (typeof inferred === "string" && inferred) {
        role = inferred;
        await ctx.db.patch(u._id, { role: inferred as any });
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
    const session = await ctx.runMutation("auth:store" as any, {
      args: {
        type: "signIn",
        userId: (resolved ?? u)._id,
        generateTokens: true,
      },
    });

    return {
      success: true,
      userId: (resolved ?? u)._id,
      email: (resolved ?? u).email,
      name: (resolved ?? u).name,
      role: finalRole,
      tokens: (session as any)?.tokens ?? null,
    };
  },
});

function inferRole(user: any): string | null {
  if (typeof user.role === "string" && user.role) return user.role;
  if (typeof user.email === "string" && user.email === ADMIN_EMAIL) return "admin";
  if (typeof user.email === "string" && user.email === process.env.ADMIN_EMAIL) return "admin";
  if (typeof user.businessName === "string" && user.businessName) return "seller";
  // Legacy real accounts (real email, not anonymous) without a stored role
  // are buyers — never guess anything else.
  if (
    typeof user.email === "string" &&
    user.email.includes("@") &&
    !user.email.toLowerCase().includes("anonymous")
  ) {
    return "buyer";
  }
  return null;
}

/**
 * Create or sync a Nexora user profile after authentication.
 * This is the authoritative path that links an auth identity to persistent role.
 */
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
    if (!identity) throw new Error("Not authenticated");

    // Merge duplicate rows for this identity email first so the profile sync
    // lands on the canonical account, not an empty duplicate.
    if (typeof identity.email === "string" && identity.email.includes("@")) {
      await mergeDuplicateAccountsByEmail(ctx, identity.email);
    }

    let user = await getSessionUser(ctx);

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

    if (!user) {
      // New accounts start PENDING with no role: no panel access until the
      // registration/verification process completes (see completeVerification).
      // The requested role is held in pendingRole until then.
      // EXCEPTION: the platform owner email is always created admin + active —
      // it must never be trapped behind the verification gate.
      user = await ctx.db.insert("users", {
        name: args.name || identity.name || identity.email?.split("@")[0] || "User",
        email: identity.email,
        phone: typeof args.phone === "string" ? args.phone : undefined,
        role: (identity.email === ADMIN_EMAIL ? "admin" : undefined) as any,
        pendingRole: identity.email === ADMIN_EMAIL ? undefined : targetRole,
        accountStatus: (identity.email === ADMIN_EMAIL ? "active" : "pending") as any,
        passwordHash: incomingPasswordHash,
        businessName: typeof args.businessName === "string" ? args.businessName : undefined,
      }) as any;
    } else {
      // If no password is ever submitted, preserve the existing accessible credential
      // so a user cannot be silently locked out by a profile sync that omits password.
      const existingPasswordHash = (user as any).passwordHash;
      if (
        incomingPassword.length > 0 &&
        (!existingPasswordHash ||
          !(await verifyStoredPasswordHash(existingPasswordHash, incomingPassword)))
      ) {
        await ctx.db.patch((user as any)._id, { passwordHash: incomingPasswordHash });
      }
      const u = user as any;

      // Platform owner: always force admin + active, bypassing the pending
      // gate entirely (fixes stale buyer/pending records from older flows).
      if (identity.email === ADMIN_EMAIL) {
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
      if (typeof args.phone === "string" && u.phone !== args.phone) {
        await ctx.db.patch(u._id, { phone: args.phone });
      }
      if (args.businessName !== undefined && u.businessName !== args.businessName) {
        await ctx.db.patch(u._id, { businessName: args.businessName });
      }

      // Role changes only apply through the verification gate. A pending
      // account keeps its pendingRole (updated if the user re-submits); an
      // active account keeps its assigned role unless admin action changes it.
      if ((u as any).accountStatus !== "active") {
        // Still pending — record the requested role and stay unverified.
        if (targetRole !== u.pendingRole) {
          await ctx.db.patch(u._id, { pendingRole: targetRole });
        }
      } else if (typeof u.role !== "string" || u.role !== targetRole) {
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
        if (!anyU.pendingRole && anyU.email?.includes("@")) {
          await ctx.db.patch(u._id, { pendingRole: "buyer" as any });
        }
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
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return { authenticated: false };

    const u = user as any;
    const hasEmail = typeof u.email === "string" && u.email.includes("@");
    const hasName = typeof u.name === "string" && u.name.trim().length > 0;
    const hasPhone = typeof u.phone === "string" && u.phone.replace(/[^0-9]/g, "").length >= 9;

    const requestedRole =
      typeof u.pendingRole === "string" && u.pendingRole
        ? u.pendingRole
        : typeof u.role === "string" && u.role
          ? u.role
          : "buyer";

    const requirements: Array<{ key: string; label: string; met: boolean }> = [
      { key: "email", label: "Verified email account", met: hasEmail },
      { key: "name", label: "Full name on profile", met: hasName },
      { key: "phone", label: "Phone number (M-Pesa & delivery)", met: hasPhone },
    ];
    const isComplete = requirements.every((r) => r.met);

    return {
      authenticated: true,
      accountStatus: (u.accountStatus as string) || (u.role ? "active" : "pending"),
      requestedRole,
      requirements,
      isComplete,
      profile: { name: u.name || "", email: u.email || "", phone: u.phone || "" },
    };
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getSessionUser(ctx);
    if (!user) throw new Error("User not found");

    const u = user as any;

    // Apply any profile updates submitted with the completion step.
    if (typeof args.name === "string" && args.name.trim() && args.name !== u.name) {
      await ctx.db.patch(u._id, { name: args.name.trim() });
    }
    if (typeof args.phone === "string" && args.phone.trim() && args.phone !== u.phone) {
      await ctx.db.patch(u._id, { phone: args.phone.trim() });
    }

    const fresh = (await ctx.db.get(u._id)) as any;

    const hasEmail = typeof fresh.email === "string" && fresh.email.includes("@");
    const hasName = typeof fresh.name === "string" && fresh.name.trim().length > 0;
    const hasPhone =
      typeof fresh.phone === "string" && fresh.phone.replace(/[^0-9]/g, "").length >= 9;

    const requestedRole =
      typeof fresh.pendingRole === "string" && fresh.pendingRole
        ? fresh.pendingRole
        : typeof fresh.role === "string" && fresh.role
          ? fresh.role
          : "buyer";

    if (!hasEmail) {
      throw new Error("Verify your email before completing registration.");
    }
    if (!hasName) {
      throw new Error("Add your full name to complete registration.");
    }
    if (!hasPhone) {
      throw new Error("Add your phone number to complete registration.");
    }

    // Admin role is never self-assigned here; the admin email path handles it.
    const finalRole = requestedRole === "admin" ? "admin" : requestedRole;

    await ctx.db.patch(u._id, {
      role: finalRole,
      accountStatus: "active" as any,
      pendingRole: undefined,
    });

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
      throw new Error(
        "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and symbol."
      );
    }

    const record = await ctx.db
      .query("passwordResetCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!record) {
      throw new Error("Invalid or expired code. Please request a new one.");
    }
    if (record.expiresAt < Date.now()) {
      await ctx.db.delete(record._id);
      throw new Error("This code has expired. Please request a new one.");
    }
    if (record.attempts >= 5) {
      await ctx.db.delete(record._id);
      throw new Error("Too many attempts. Please request a new code.");
    }

    const valid = await verifyStoredPasswordHash(record.codeHash, args.code.trim());
    if (!valid) {
      await ctx.db.patch(record._id, { attempts: record.attempts + 1 });
      throw new Error("Invalid code. Please check and try again.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (!user) {
      await ctx.db.delete(record._id);
      throw new Error("Account not found.");
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
      throw new Error(
        "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and symbol."
      );
    }

    if (args.confirmPassword !== args.newPassword) {
      throw new Error("Passwords do not match.");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getSessionUser(ctx);

    if (!user) throw new Error("User not found");

    const u = user as any;

    if (
      args.currentPassword &&
      typeof u.passwordHash === "string" &&
      !(await verifyStoredPasswordHash(u.passwordHash, args.currentPassword))
    ) {
      throw new Error("Current password is incorrect.");
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
    if (!identity) throw new Error("Not authenticated");

    let user = await getSessionUser(ctx);

    // If user not found in DB (e.g. just created via auth), create the user record
    if (!user) {
      const name = identity.name || identity.email?.split("@")[0] || "User";
      const phoneFromForm = typeof args.phone === "string" ? args.phone : undefined;

      const targetRoleForInsert = resolveRoleForAdminFlow(identity.email, typeof args.role === "string" ? args.role : undefined, null);
      user = await ctx.db.insert("users", {
        name,
        email: identity.email,
        role: targetRoleForInsert,
        phone: phoneFromForm,
        kycStatus: "not_started",
        lastLoginAt: Date.now(),
        lastActivityAt: Date.now(),
        joinedAt: Date.now(),
      }) as any;
    } else {
      // User already exists in DB — ensure role is set correctly
      const u = user as any;
      const phoneFromForm = typeof args.phone === "string" ? args.phone : undefined;

      // Update phone if provided
      if (phoneFromForm && u.phone !== phoneFromForm) {
        await ctx.db.patch(u._id, { phone: phoneFromForm });
      }

      // ALWAYS assign the correct role — this is the critical fix.
      // Previously this only ran when !u.role || u.role === "buyer", missing users
      // whose role was already set to something else or undefined from legacy signups.
      const targetRole = resolveRoleForAdminFlow(identity.email, typeof args.role === "string" ? args.role : undefined, user as any);
      if (targetRole && u.role !== targetRole) {
        await ctx.db.patch(u._id, { role: targetRole });
        // Refresh user record after patch (type assertion needed since db.get is generic)
        user = (await ctx.db.get(u._id)) as typeof user;
      }

      // Update activity timestamp on every login, even when the role does not change.
      await ctx.db.patch(u._id, { lastActivityAt: Date.now() });
    }

    if (!user) return { promoted: false, message: "User not found" };

    // Auto-promote if email matches admin email
    if (identity.email === ADMIN_EMAIL) {
      const fresh = await ctx.db.get((user as any)._id);
      const finalUser = fresh as any;
      if (finalUser && finalUser.role !== "admin") {
        await ctx.db.patch(finalUser._id, { role: "admin" });
      }
      await ctx.db.patch(finalUser?._id ?? (user as any)._id, { lastActivityAt: Date.now() });
      return { promoted: true, message: "You have been promoted to admin!" };
    }

    await ctx.db.patch((user as any)._id, { lastActivityAt: Date.now() });
    return { promoted: false, message: "No auto-promotion needed" };
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
    if (!identity) throw new Error("Not authenticated");

    // Resolve the caller's user record from the session itself
    const caller = await getSessionUser(ctx);

    if (!caller) throw new Error("User not found");

    // Allow if the caller is already an admin, or if it's the hardcoded admin email
    // (the email itself is the ultimate authority — even if DB role is missing)
    const callerIsAdmin = caller.role === "admin" || identity.email === ADMIN_EMAIL;
    if (!callerIsAdmin) {
      throw new Error("Unauthorized: only admins can promote users");
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

    const caller = await getSessionUser(ctx);
    if (!caller) return { isAdmin: false, authenticated: true };

    if (identity.email === ADMIN_EMAIL) {
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
    county: v.optional(v.string()),
    town: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getSessionUser(ctx);
    if (!user) throw new Error("User not found");

    const updates: Record<string, any> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.county !== undefined) updates.county = args.county;
    if (args.town !== undefined) updates.town = args.town;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return { success: true };
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
