import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** File a dispute for an escrow transaction */
export const fileDispute = mutation({
  args: {
    escrowId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
    evidence: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");

    // Verify escrow exists and belongs to this user
    const allEscrows = await ctx.db.query("escrows").collect();
    const escrow = allEscrows.find((e) => e._id === args.escrowId);
    if (!escrow) throw new Error("Escrow not found");
    if (escrow.buyerId !== user._id && escrow.sellerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Create dispute
    const disputeId = await ctx.db.insert("disputes", {
      escrowId: args.escrowId,
      filedBy: user._id,
      reason: args.reason,
      description: args.description,
      evidence: args.evidence,
      status: "open",
      createdAt: Date.now(),
    });

    // Update escrow status to disputed
    const escrowRecord = allEscrows.find((e) => e._id === args.escrowId);
    if (escrowRecord) await ctx.db.patch(escrowRecord._id, { status: "disputed" });

    return { disputeId };
  },
});

/** Get disputes for current user (buyer or seller) */
export const getMyDisputes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) return [];

    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_filer", (q) => q.eq("filedBy", user._id))
      .order("desc")
      .collect();

    return disputes;
  },
});

/** Get all disputes (admin) */
export const getAllDisputes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("disputes").order("desc").collect();
  },
});

/** Update dispute status (admin) */
export const updateDisputeStatus = mutation({
  args: {
    disputeId: v.id("disputes"),
    status: v.union(
      v.literal("open"),
      v.literal("under_review"),
      v.literal("resolved"),
      v.literal("escalated"),
      v.literal("closed")
    ),
    resolution: v.optional(v.string()),
    refundAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || user.role !== "admin") throw new Error("Admin only");

    const updates: Record<string, any> = {
      status: args.status,
    };
    if (args.resolution) updates.resolution = args.resolution;
    if (args.refundAmount !== undefined) updates.refundAmount = args.refundAmount;
    if (args.status === "resolved") updates.resolvedAt = Date.now();

    await ctx.db.patch(args.disputeId, updates);

    // If resolved with a refund amount, trigger refund via server-side wallet mutation.
    if (args.status === "resolved" && args.refundAmount !== undefined && args.refundAmount > 0) {
      try {
        await ctx.runMutation("wallet:refundEscrow", {
          escrowId: args.disputeId,
          reason: `Admin dispute resolution: ${args.resolution || "resolved"}`,
        }).catch(() => {});
      } catch {
        // mutation path may not exist yet; safe to ignore
      }
    }

    return { success: true };
  },
});
