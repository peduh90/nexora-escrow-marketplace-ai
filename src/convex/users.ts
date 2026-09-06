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
 * Promote a user to admin. In production, this should be restricted
 * to existing super-admins or done via a server-side script.
 */
export const promoteToAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.email} not found`);
    }

    // Update role to admin
    await ctx.db.patch(user._id, { role: "admin" });

    return { success: true, userId: user._id };
  },
});

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
    const buyers = realUsers.filter((u: any) => u.role === "buyer" || (!u.role && !u.businessName));
    const sellers = realUsers.filter((u: any) => u.role === "seller");
    const freelancers = realUsers.filter((u: any) => u.role === "freelancer");
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
      const role: "admin" | "buyer" | "seller" | "driver" | undefined =
        identity.email === ADMIN_EMAIL ? "admin"
          : (args.role === "seller" ? "seller" : args.role === "admin" ? "admin" : args.role === "driver" ? "driver" : "buyer");
      user = await ctx.db.insert("users", {
        name: identity.name || identity.email?.split("@")[0] || "User",
        email: identity.email,
        role: role,
        kycStatus: "not_started",
      }) as any;
    } else if (args.role && user.role !== args.role && user.role !== "admin") {
      // Update role if user chose a different one (only for valid schema roles)
      const validRole = args.role === "seller" ? "seller"
        : args.role === "admin" ? "admin"
        : args.role === "driver" ? "driver"
        : undefined;
      if (validRole) {
        await ctx.db.patch(user._id, { role: validRole });
        user = await ctx.db.get(user._id);
      }
    }

    // Auto-promote if email matches admin email and not already admin
    if (identity.email === ADMIN_EMAIL && user && user.role !== "admin") {
      await ctx.db.patch(user._id, { role: "admin" });
      return { promoted: true, message: "You have been promoted to admin!" };
    }

    return { promoted: false, message: "No auto-promotion needed" };
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
