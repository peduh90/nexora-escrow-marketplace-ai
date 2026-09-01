import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Create a new listing (seller adds product) */
export const createListing = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    price: v.number(),
    currency: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    transportAvailable: v.boolean(),
    transportFee: v.optional(v.number()),
    originCounty: v.string(),
    originTown: v.string(),
    escrowProtection: v.boolean(),
    condition: v.optional(v.string()),
    verified: v.boolean(),
    sellerName: v.string(),
    sellerReputation: v.number(),
    sellerVerified: v.boolean(),
    negotiable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");

    const listingId = await ctx.db.insert("listings", {
      sellerId: user._id,
      title: args.title,
      description: args.description,
      price: args.price,
      currency: args.currency,
      category: args.category,
      subcategory: args.subcategory,
      images: args.images ?? [],
      transportAvailable: args.transportAvailable,
      transportFee: args.transportFee,
      originCounty: args.originCounty,
      originTown: args.originTown,
      escrowProtection: args.escrowProtection,
      insuranceProtection: false,
      condition: args.condition,
      verified: args.verified,
      sellerName: args.sellerName,
      sellerReputation: args.sellerReputation,
      sellerVerified: args.sellerVerified,
      views: 0,
      favorites: 0,
      status: "active",
      createdAt: Date.now(),
    });

    // Update seller's active listings count
    const current = user.activeListings || 0;
    await ctx.db.patch(user._id, { activeListings: current + 1 });

    return { listingId };
  },
});

/** Update a listing */
export const updateListing = mutation({
  args: {
    listingId: v.id("listings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    condition: v.optional(v.string()),
    originCounty: v.optional(v.string()),
    originTown: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("sold"), v.literal("paused"), v.literal("removed"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== user._id) throw new Error("Not authorized");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.price !== undefined) updates.price = args.price;
    if (args.category !== undefined) updates.category = args.category;
    if (args.images !== undefined) updates.images = args.images;
    if (args.condition !== undefined) updates.condition = args.condition;
    if (args.originCounty !== undefined) updates.originCounty = args.originCounty;
    if (args.originTown !== undefined) updates.originTown = args.originTown;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.listingId, updates);
    return { success: true };
  },
});

/** Delete a listing (soft delete - set status to removed) */
export const deleteListing = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.listingId, { status: "removed", updatedAt: Date.now() });
    const current = user.activeListings || 0;
    await ctx.db.patch(user._id, { activeListings: Math.max(0, current - 1) });
    return { success: true };
  },
});

/** Get all active listings for the marketplace */
export const getActiveListings = query({
  args: {
    category: v.optional(v.string()),
    county: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let listings = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    if (args.category) {
      listings = listings.filter((l) => l.category === args.category);
    }

    if (args.county) {
      listings = listings.filter((l) => l.originCounty === args.county);
    }

    return listings.slice(0, args.limit ?? 50);
  },
});

/** Get listings by seller */
export const getSellerListings = query({
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
      .query("listings")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .collect();
  },
});

/** Get a single listing by ID */
export const getListing = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.listingId);
  },
});

/** Increment view count */
export const incrementViews = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) return;
    await ctx.db.patch(args.listingId, { views: listing.views + 1 });
  },
});

/** Search listings by text (basic title/description match) */
export const searchListings = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    county: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    condition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allActive = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let results = allActive;

    // Text search
    if (args.query) {
      const q = args.query.toLowerCase();
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (args.category) {
      results = results.filter((l) => l.category === args.category);
    }

    // County filter
    if (args.county) {
      results = results.filter((l) => l.originCounty === args.county);
    }

    // Price filters
    if (args.minPrice !== undefined) {
      results = results.filter((l) => l.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      results = results.filter((l) => l.price <= args.maxPrice!);
    }

    // Condition filter
    if (args.condition) {
      results = results.filter((l) => l.condition === args.condition);
    }

    return results;
  },
});
