import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Create a review after a completed transaction */
export const createReview = mutation({
  args: {
    orderId: v.string(),
    listingId: v.string(),
    sellerId: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new Error("User not found");

    // Check if already reviewed this order
    const existing = await ctx.db
      .query("reviews")
      .filter((q) => q.eq(q.field("orderId"), args.orderId))
      .first();
    if (existing) throw new Error("You have already reviewed this order");

    if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be 1-5");

    const reviewId = await ctx.db.insert("reviews", {
      orderId: args.orderId,
      listingId: args.listingId,
      buyerId: user._id,
      sellerId: args.sellerId,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Notify seller
    await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "review",
      title: "New Review",
      message: `${user.name || "A buyer"} left a ${args.rating}-star review`,
      read: false,
      link: `/seller/reviews`,
      createdAt: Date.now(),
    });

    return { reviewId };
  },
});

/** Get reviews for a seller */
export const getSellerReviews = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .order("desc")
      .collect();
  },
});

/** Get average rating for a seller */
export const getSellerRating = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .collect();

    if (reviews.length === 0) return { average: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
  },
});

/** Get unread notifications for current user */
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect()
      .then((n) => n.slice(0, 50));
  },
});

/** Get unread notification count */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();
    return unread.length;
  },
});

/** Mark notifications as read */
export const markAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});
