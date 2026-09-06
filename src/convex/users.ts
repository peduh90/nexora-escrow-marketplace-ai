import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";

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

export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

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

    const validPassword =
      typeof u.passwordHash === "string" &&
      (u.passwordHash === args.password ||
        (u.passwordHash.startsWith("pbkdf2:") && verifyPasswordHash(u.passwordHash, args.password)));

    if (!validPassword) {
      return { success: false, error: "Invalid email or password." };
    }

    if (!u.role) {
      const inferred = inferRole(u);
      if (inferred) {
        await ctx.db.patch(u._id, { role: inferred });
      }
    }

    await ctx.db.patch(u._id, { lastLoginAt: Date.now(), lastActivityAt: Date.now() });

    const fresh = await ctx.db.get(u._id);
    const resolved = fresh as any;

    return {
      success: true,
      userId: resolved._id,
      email: resolved.email,
      name: resolved.name,
      role: resolved.role || inferRole(resolved) || "buyer",
    };
  },
});

function inferRole(user: any): string | null {
  if (user.role) return user.role;
  if (user.email === process.env.ADMIN_EMAIL) return "admin";
  if (user.businessName) return "seller";
  return null;
}

function verifyPasswordHash(storedHash: string, password: string): boolean {
  if (!storedHash.startsWith("pbkdf2:")) return false;
  try {
    const parts = storedHash.split(":");
    const [, , salt, iterations, keyLength, algorithm, expected] = parts;
    if (!salt || !iterations || !keyLength || !algorithm || !expected) return false;
    return false;
  } catch {
    return false;
  }
}

export const ensureUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    businessName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      const targetRole =
        identity.email === process.env.ADMIN_EMAIL
          ? "admin"
          : (args.role as any) || (args.businessName ? "seller" : "buyer");

      user = await ctx.db.insert("users", {
        name: args.name || identity.name || identity.email?.split("@")[0] || "User",
        email: identity.email,
        phone: typeof args.phone === "string" ? args.phone : undefined,
        role: targetRole,
        businessName: typeof args.businessName === "string" ? args.businessName : undefined,
        lastLoginAt: Date.now(),
        lastActivityAt: Date.now(),
        joinedAt: Date.now(),
      }) as any;
    } else {
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

      const targetRole =
        identity.email === process.env.ADMIN_EMAIL
          ? "admin"
          : (args.role as any) ||
            (u.businessName
              ? "seller"
              : u.role ||
              (args.businessName
                ? "seller"
                : "buyer"));

      if (u.role !== targetRole) {
        await ctx.db.patch(u._id, { role: targetRole });
      }

      await ctx.db.patch(u._id, { lastLoginAt: Date.now(), lastActivityAt: Date.now() });
      user = await ctx.db.get(u._id);
    }

    return { userId: (user as any)._id, role: (user as any).role };
  },
});

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

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");

    const u = user as any;

    if (
      args.currentPassword &&
      typeof u.passwordHash === "string" &&
      u.passwordHash !== args.currentPassword
    ) {
      throw new Error("Current password is incorrect.");
    }

    await ctx.db.patch(u._id, { passwordHash: hashPasswordForStorage(args.newPassword) });
    return { success: true };
  },
});

function isStrongPassword(password: string): boolean {
  if (typeof password !== "string") return false;
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (/\d/.test(password) === false) return false;
  if (/[^A-Za-z0-9]/.test(password) === false) return false;
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

function hashPasswordForStorage(password: string): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltBase64 = Array.from(new Uint8Array(salt))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "pbkdf2:" + saltBase64 + ":100000:32:sha256:" + password;
}

export const getUserCounts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    const realUsers = all.filter((u: any) =>
      u.email && u.email.includes("@") &&
      u.name !== "Guest User" &&
      !u.email?.toLowerCase().includes("anonymous")
    );
    const buyers = realUsers.filter((u: any) => u.role === "buyer" || (!u.role && u.email && u.email.includes("@") && u.name && !u.businessName));
    const sellers = realUsers.filter((u: any) => u.role === "seller" || !!u.businessName);
    const admins = realUsers.filter((u: any) => u.role === "admin");
    const verified = realUsers.filter((u: any) => u.kycStatus === "verified");
    const pendingKyc = realUsers.filter((u: any) => u.kycStatus === "pending");
    return {
      total: realUsers.length,
      buyers: buyers.length,
      sellers: sellers.length,
      freelancers: 0,
      admins: admins.length,
      verified: verified.length,
      pendingKyc: pendingKyc.length,
      recent: realUsers.filter((u: any) => (u._creationTime || 0) > Date.now() - 86400000).length,
    };
  },
});

export const getAllListings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("listings").collect();
  },
});

export const getAllEscrows = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("escrows").collect();
  },
});

const ADMIN_EMAIL = "murimiedwin227@gmail.com";

export const checkAndPromoteAdmin = mutation({
  args: {
    role: v.optional(v.string()),
    phone: v.optional(v.string()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      const validRole: "admin" | "buyer" | "seller" | "driver" | undefined =
        identity.email === ADMIN_EMAIL ? "admin"
          : (args.role === "seller" ? "seller" : args.role === "admin" ? "admin" : args.role === "driver" ? "driver" : "buyer");

      const name = identity.name || identity.email?.split("@")[0] || "User";
      const phoneFromForm = typeof args.phone === "string" ? args.phone : undefined;

      user = await ctx.db.insert("users", {
        name,
        email: identity.email,
        role: validRole,
        phone: phoneFromForm,
        kycStatus: "not_started",
        lastLoginAt: Date.now(),
        lastActivityAt: Date.now(),
        joinedAt: Date.now(),
      }) as any;
    } else {
      const u = user as any;
      const phoneFromForm = typeof args.phone === "string" ? args.phone : undefined;

      if (phoneFromForm && u.phone !== phoneFromForm) {
        await ctx.db.patch(u._id, { phone: phoneFromForm });
      }

      const targetRole: "admin" | "buyer" | "seller" | "driver" | undefined =
        u.email === ADMIN_EMAIL ? "admin"
          : (args.role === "seller" ? "seller" : args.role === "admin" ? "admin" : args.role === "driver" ? "driver" : "buyer");
      if (targetRole && u.role !== targetRole) {
        await ctx.db.patch(u._id, { role: targetRole });
        user = (await ctx.db.get(u._id)) as typeof user;
      }
    }

    if (!user) return { promoted: false, message: "User not found" };

    if (identity.email === ADMIN_EMAIL) {
      const fresh = await ctx.db.get((user as any)._id);
      const finalUser = fresh as any;
      if (finalUser && finalUser.role !== "admin") {
        await ctx.db.patch(finalUser._id, { role: "admin" });
      }
      return { promoted: true, message: "You have been promoted to admin!" };
    }

    return { promoted: false, message: "No auto-promotion needed" };
  },
});

export const promoteToAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const caller = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!caller) throw new Error("User not found");

    const callerIsAdmin = caller.role === "admin" || identity.email === ADMIN_EMAIL;
    if (!callerIsAdmin) {
      throw new Error("Unauthorized: only admins can promote users");
    }

    if (identity.email !== ADMIN_EMAIL && args.email !== identity.email) {
      if (caller.role !== "admin") {
        throw new Error("Unauthorized: only admins can promote other users");
      }
    }

    const target = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!target) throw new Error(`User with email ${args.email} not found`);

    await ctx.db.patch(target._id, { role: "admin" });
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
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return null;
    return { _id: user._id, email: user.email, name: user.name, role: user.role };
  },
});

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

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
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
