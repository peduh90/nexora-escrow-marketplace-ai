import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// --- Password helpers using Web Crypto (available in Convex V8) ---
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const computed = await hashPassword(password, salt);
  return computed === hash;
}

/**
 * Admin 2FA Setup — generates a new TOTP secret and returns provisioning URI.
 * Only callable by users with role=admin.
 */
export const setupAdmin2FA = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: admin only");
    }

    // Generate TOTP secret using otpauth named exports
    const { TOTP, Secret } = await import("otpauth");
    const totp = new TOTP({
      issuer: "Nexora Market",
      label: identity.email || "Admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;

    // Store the secret on the user record
    await ctx.db.patch(user._id, {
      adminTotpSecret: secret,
      adminTwoFactorEnabled: false,
    });

    return {
      secret,
      uri: totp.toString(),
    };
  },
});

/**
 * Verify a TOTP code against the stored secret.
 * Returns true if valid.
 */
export const verifyAdminCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || user.role !== "admin" || !user.adminTotpSecret) {
      return false;
    }

    try {
      const { TOTP, Secret } = await import("otpauth");
      const totp = new TOTP({
        issuer: "Nexora Market",
        label: identity.email || "Admin",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(user.adminTotpSecret),
      });

      const delta = totp.validate({ token: args.code, window: 1 });
      return delta !== null;
    } catch {
      return false;
    }
  },
});

/**
 * Confirm 2FA setup after first successful verification.
 */
export const confirmAdmin2FA = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: admin only");
    }

    if (!user.adminTotpSecret) {
      throw new Error("2FA not initialized. Run setupAdmin2FA first.");
    }

    try {
      const { TOTP, Secret } = await import("otpauth");
      const totp = new TOTP({
        issuer: "Nexora Market",
        label: identity.email || "Admin",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(user.adminTotpSecret),
      });

      const delta = totp.validate({ token: args.code, window: 1 });
      if (delta === null) {
        throw new Error("Invalid 2FA code. Please try again.");
      }

      // Enable 2FA
      await ctx.db.patch(user._id, {
        adminTwoFactorEnabled: true,
        adminLastLogin: Date.now(),
      });

      return { success: true };
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Invalid 2FA code");
    }
  },
});

/**
 * Check if the current admin has 2FA enabled.
 */
export const isAdmin2FAEnabled = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { enabled: false, isAdmin: false, hasSecret: false };

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) return { enabled: false, isAdmin: false, hasSecret: false };

    return {
      enabled: user.adminTwoFactorEnabled === true,
      isAdmin: user.role === "admin",
      hasSecret: !!user.adminTotpSecret,
    };
  },
});

/**
 * Validate admin 2FA code and mark login time.
 */
export const validateAdmin2FA = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: admin only");
    }

    if (!user.adminTotpSecret) {
      throw new Error("Admin 2FA not set up");
    }

    try {
      const { TOTP, Secret } = await import("otpauth");
      const totp = new TOTP({
        issuer: "Nexora Market",
        label: identity.email || "Admin",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(user.adminTotpSecret),
      });

      const delta = totp.validate({ token: args.code, window: 1 });
      if (delta === null) {
        throw new Error("Invalid 2FA code. Please try again.");
      }

      // Update last login
      await ctx.db.patch(user._id, {
        adminLastLogin: Date.now(),
      });

      return { success: true };
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Invalid 2FA code");
    }
  },
});

/**
 * Set or update admin password. Only callable by admins.
 */
export const setAdminPassword = mutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: admin only");
    }

    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const salt = generateSalt();
    const hash = await hashPassword(args.password, salt);

    await ctx.db.patch(user._id, {
      adminPasswordHash: hash,
      adminPasswordSalt: salt,
    });

    return { success: true };
  },
});

/**
 * Verify admin password for login.
 */
export const verifyAdminPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("No account found with this email");
    }

    if (user.role !== "admin") {
      throw new Error("This account does not have admin privileges");
    }

    if (!user.adminPasswordHash || !user.adminPasswordSalt) {
      throw new Error("No admin password set. Please contact support.");
    }

    const valid = await verifyPassword(args.password, user.adminPasswordHash, user.adminPasswordSalt);
    if (!valid) {
      throw new Error("Incorrect password");
    }

    return { success: true };
  },
});
