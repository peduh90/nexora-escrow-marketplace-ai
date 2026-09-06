import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";

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
 * Verify login with email + password
 */
export const verifyLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("users").collect();
    const user = all.find((u: any) =>
      u.email?.toLowerCase() === args.email.toLowerCase() &&
      u.passwordHash === args.password
    );
    return user ? { success: true, userId: user._id, name: user.name, role: user.role } : { success: false };
  },
});

/**
 * Update user password
 */
export const updatePassword = mutation({
  args: {
    currentPassword: v.optional(v.string()),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");

    // If changing own password, verify current
    if (args.currentPassword && user.passwordHash !== args.currentPassword) {
      throw new Error("Current password is incorrect");
    }

    await ctx.db.patch(user._id, { passwordHash: args.newPassword });
    return { success: true };
  },
});

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
    const buyers = realUsers.filter((u: any) => u.role === "buyer" || (!u.role && u.email && u.email.includes("@") && u.name && !u.businessName));
    const sellers = realUsers.filter((u: any) => u.role === "seller" || !!u.businessName);
    const freelancers = realUsers.filter((u: any) => u.role === "freelancer" || (u.name && u.businessName && !u.role));
    const admins = realUsers.filter((u: any) => u.role === "admin");
    const verified = realUsers.filter((u: any) => u.kycStatus === "verified");
    const pendingKyc = realUsers.filter((u: any) => u.kycStatus === "pending");
    return {
      total: realUsers.length,
      buyers: buyers.length,
      sellers: sellers.length,
      freelancers: freelancers.length,
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

    // If user not found in DB (e.g. just created via auth), create the user record
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
      }) as any;
    } else {
      // User already exists in DB — ensure role is set correctly
      const u = user as any;
      const phoneFromForm = typeof args.phone === "string" ? args.phone : undefined;

      // Update phone if provided
      if (phoneFromForm && u.phone !== phoneFromForm) {
        await ctx.db.patch(u._id, { phone: phoneFromForm });
      }

      // Always assign the correct role if the user doesn't have one yet
      // This fixes the admin dashboard showing 0 buyers/sellers
      if (!u.role || u.role === "buyer") {
        const targetRole: "admin" | "buyer" | "seller" | "driver" | undefined =
          u.email === ADMIN_EMAIL ? "admin"
            : (args.role === "seller" ? "seller" : args.role === "admin" ? "admin" : args.role === "driver" ? "driver" : "buyer");
        if (targetRole) {
          await ctx.db.patch(u._id, { role: targetRole });
        }
      }
    }

    if (!user) return { promoted: false, message: "User not found" };

    // Update role if user chose a different one (only for valid schema roles)
    const curUser = user as any;
    const targetRole: "admin" | "buyer" | "seller" | "driver" | undefined =
      curUser.email === ADMIN_EMAIL ? "admin"
        : (args.role === "seller" ? "seller" : args.role === "admin" ? "admin" : args.role === "driver" ? "driver" : "buyer");
    if (targetRole && curUser.role !== targetRole && curUser.role !== "admin") {
      await ctx.db.patch(curUser._id, { role: targetRole });
    }

    // Auto-promote if email matches admin email and not already admin
    const finalUser = user as any;
    if (identity.email === ADMIN_EMAIL && finalUser.role !== "admin") {
      await ctx.db.patch(finalUser._id, { role: "admin" });
      return { promoted: true, message: "You have been promoted to admin!" };
    }

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
    const ADMIN_EMAIL = "murimiedwin227@gmail.com";
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Resolve the caller's user record
    const caller = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

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
