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
/** Admin: get all users */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
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

/** Auto-promote first admin — anyone signing up with this email gets admin role */
const ADMIN_EMAIL = "murimiedwin227@gmail.com";

export const checkAndPromoteAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");

    // Auto-promote if email matches admin email and not already admin
    if (identity.email === ADMIN_EMAIL && user.role !== "admin") {
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
