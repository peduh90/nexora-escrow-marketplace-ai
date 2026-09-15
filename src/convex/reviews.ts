import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getSessionUser } from "./users";
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
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new ConvexError("User not found");

    // Check if already reviewed this order
    const existing = await ctx.db
      .query("reviews")
      .filter((q) => q.eq(q.field("orderId"), args.orderId))
      .first();
    if (existing) throw new ConvexError("You have already reviewed this order");

    if (args.rating < 1 || args.rating > 5) throw new ConvexError("Rating must be 1-5");

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
    let sellerId = args.sellerId;
    if (sellerId === "me") {
      const me = await getSessionUser(ctx);
      if (!me) return [];
      sellerId = me._id as unknown as string;
    }
    return await ctx.db
      .query("reviews")
      .withIndex("by_seller", (q) => q.eq("sellerId", sellerId))
      .order("desc")
      .collect();
  },
});

/** Get average rating for a seller. Accepts "me" for the current user. */
export const getSellerRating = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    let sellerId = args.sellerId;
    if (sellerId === "me") {
      const me = await getSessionUser(ctx);
      if (!me) return { average: 0, count: 0 };
      sellerId = me._id as unknown as string;
    }
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_seller", (q) => q.eq("sellerId", sellerId))
      .collect();

    if (reviews.length === 0) return { average: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      const stars = Math.min(5, Math.max(1, Math.round(r.rating)));
      breakdown[stars] = (breakdown[stars] || 0) + 1;
    }
    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
      breakdown,
    };
  },
});

/** Seller: post a public reply to a review of their own store. */
export const replyToReview = mutation({
  args: {
    reviewId: v.string(),
    reply: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const review = (await ctx.db.get(args.reviewId as any)) as any;
    if (!review) throw new ConvexError("Review not found");
    if (review.sellerId !== (user as any)._id) {
      throw new ConvexError("You can only reply to reviews of your own store");
    }

    await ctx.db.patch(review._id, { sellerReply: args.reply });
    return { success: true };
  },
});

/** Admin: remove an abusive/fake review. Seller replies are kept in audit
 * trails through the notifications system; the review itself is deleted. */
export const deleteReview = mutation({
  args: { reviewId: v.string() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");
    if ((user as any).role !== "admin") {
      throw new ConvexError("Unauthorized: admin only");
    }

    const review = (await ctx.db.get(args.reviewId as any)) as any;
    if (!review) throw new ConvexError("Review not found");

    await ctx.db.delete(review._id);
    return { success: true };
  },
});

/** Get unread notifications for current user */
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
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
    const user = await getSessionUser(ctx);
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
    const user = await getSessionUser(ctx);
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
