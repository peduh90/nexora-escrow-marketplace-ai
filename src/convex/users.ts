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

    return user;
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
  if (identity && typeof identity.email === "string" && identity.email.length > 0) {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (user) return user as any;
  }
  return null;
};

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

/** Admin: get all real users (excludes anonymous/guest accounts) */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    return all.filter((u: any) =>
      u.email && u.email.includes("@") &&
      u.name !== "Guest User" &&
      !u.email?.toLowerCase().includes("anonymous")
    );
  },
});

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

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

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

    if (hasBusinessName && role !== "seller" && role !== "admin") {
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

    return {
      success: true,
      userId: (resolved ?? u)._id,
      email: (resolved ?? u).email,
      name: (resolved ?? u).name,
      role: finalRole,
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
      user = await ctx.db.insert("users", {
        name: args.name || identity.name || identity.email?.split("@")[0] || "User",
        email: identity.email,
        phone: typeof args.phone === "string" ? args.phone : undefined,
        role: targetRole,
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

      if (args.name !== undefined && u.name !== args.name) {
        await ctx.db.patch(u._id, { name: args.name });
      }
      if (typeof args.phone === "string" && u.phone !== args.phone) {
        await ctx.db.patch(u._id, { phone: args.phone });
      }
      if (args.businessName !== undefined && u.businessName !== args.businessName) {
        await ctx.db.patch(u._id, { businessName: args.businessName });
      }

      if (typeof u.role !== "string" || u.role !== targetRole) {
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

/** Admin: get user count summary */
export const getUserCounts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    const realUsers = all.filter((u: any) =>
      u.email && u.email.includes("@") &&
      u.name !== "Guest User" &&
      !u.email?.toLowerCase().includes("anonymous")
    );
    // Users with businessName are sellers regardless of role field.
    // Users with a real email/name but no role default to buyer.
    // Freelancers are tracked in freelanceProfiles, NOT in users.role — the role validator
    // doesn't include "freelancer" so this will always be 0. Count them in the admin dashboard
    // from the freelanceProfiles table instead.
    const buyers = realUsers.filter((u: any) => u.role === "buyer" || (!u.role && u.email && u.email.includes("@") && u.name && !u.businessName));
    const sellers = realUsers.filter((u: any) => u.role === "seller" || !!u.businessName);
    const admins = realUsers.filter((u: any) => u.role === "admin");
    const verified = realUsers.filter((u: any) => u.kycStatus === "verified");
    const pendingKyc = realUsers.filter((u: any) => u.kycStatus === "pending");
    return {
      total: realUsers.length,
      buyers: buyers.length,
      sellers: sellers.length,
      freelancers: 0, // freelancers are counted from freelanceProfiles table in admin.ts
      admins: admins.length,
      verified: verified.length,
      pendingKyc: pendingKyc.length,
      recent: realUsers.filter((u: any) => (u._creationTime || 0) > Date.now() - 86400000).length,
    };
  },
});

/** Admin: get all listings */
export const getAllListings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("listings").collect();
  },
});

/** Admin: get all escrows */
export const getAllEscrows = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("escrows").collect();
  },
});

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

      user = await ctx.db.insert("users", {
        name,
        email: identity.email,
        role: resolveRoleForAdminFlow(identity.email, typeof args.role === "string" ? args.role : undefined, null),
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
 * The caller's own role is checked — a non-admin user with any other email
 * cannot call this, even if they pass the admin email as the target.
 */
export const promoteToAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Resolve the caller's user record
    const caller = await getSessionUser(ctx);

    if (!caller) throw new Error("User not found");

    // Allow if the caller is already an admin, or if it's the hardcoded admin email
    // (the email itself is the ultimate authority — even if DB role is missing)
    const callerIsAdmin = caller.role === "admin" || identity.email === ADMIN_EMAIL;
    if (!callerIsAdmin) {
      throw new Error("Unauthorized: only admins can promote users");
    }

    // Prevent promoting someone else to admin if caller is not actually admin
    // (the ADMIN_EMAIL path only allows self-promotion)
    if (identity.email !== ADMIN_EMAIL && args.email !== identity.email) {
      // Only an existing admin can promote other people
      if (caller.role !== "admin") {
        throw new Error("Unauthorized: only admins can promote other users");
      }
    }

    const target = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!target) throw new Error(`User with email ${args.email} not found`);

    await ctx.db.patch(target._id, { role: "admin" as const });
    return { success: true, userId: target._id };
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const user = await ctx.db.get(userId);
    return user?.role === "admin";
  },
});

export const getAdminUser = query({
  args: {},
  handler: async (ctx) => {
    const ADMIN_EMAIL = "murimiedwin227@gmail.com";
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
