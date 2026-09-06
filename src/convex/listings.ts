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
    attributes: v.optional(v.record(v.string(), v.string())),
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
      attributes: args.attributes,
      negotiable: args.negotiable,
      views: 0,
      favorites: 0,
      status: "active",
      createdAt: Date.now(),
    });

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
    images: v.optional(v.array(v.string())),
    condition: v.optional(v.string()),
    attributes: v.optional(v.record(v.string(), v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("sold"), v.literal("paused"), v.literal("removed"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== identity.subject) throw new Error("Not authorized");

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.price !== undefined) updates.price = args.price;
    if (args.images !== undefined) updates.images = args.images;
    if (args.condition !== undefined) updates.condition = args.condition;
    if (args.attributes !== undefined) updates.attributes = args.attributes;
    if (args.status !== undefined) updates.status = args.status;
    updates.updatedAt = Date.now();

    await ctx.db.patch(args.listingId, updates);
    return { success: true };
  },
});

/** Delete a listing */
export const deleteListing = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== identity.subject) throw new Error("Not authorized");

    await ctx.db.patch(args.listingId, { status: "removed" });
    return { success: true };
  },
});

/** Get active listings (homepage feed) */
export const getActiveListings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const allActive = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(args.limit ?? 50);

    // Resolve image URLs from storage or keep external URLs as-is
    const listings = await Promise.all(
      allActive.map(async (listing) => {
        const imageUrls: string[] = [];
        if (listing.images) {
          for (const img of listing.images) {
            // Try Convex storage first
            try {
              const url = await ctx.storage.getUrl(img);
              if (url) { imageUrls.push(url); continue; }
            } catch { /* not a storage key, try as external URL */ }
            // Fallback: treat as external URL (e.g. Unsplash)
            if (typeof img === "string" && img.startsWith("http")) {
              imageUrls.push(img);
            }
          }
        }
        return { ...listing, images: imageUrls };
      })
    );

    return listings;
  },
});

/** Get seller's own listings */
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

    const listings = await ctx.db
      .query("listings")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .collect();

    // Resolve image URLs from storage or keep external URLs as-is
    return Promise.all(
      listings.map(async (listing) => {
        const imageUrls: string[] = [];
        if (listing.images) {
          for (const img of listing.images) {
            try {
              const url = await ctx.storage.getUrl(img);
              if (url) { imageUrls.push(url); continue; }
            } catch { /* not a storage key, try as external URL */ }
            if (typeof img === "string" && img.startsWith("http")) {
              imageUrls.push(img);
            }
          }
        }
        return { ...listing, images: imageUrls };
      })
    );
  },
});

/** Get a single listing by ID */
export const getListing = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) return null;

    // Resolve image URLs from storage or keep external URLs as-is
    const imageUrls: string[] = [];
    if (listing.images) {
      for (const img of listing.images) {
        try {
          const url = await ctx.storage.getUrl(img);
          if (url) { imageUrls.push(url); continue; }
        } catch { /* not a storage key, try as external URL */ }
        if (typeof img === "string" && img.startsWith("http")) {
          imageUrls.push(img);
        }
      }
    }

    return { ...listing, images: imageUrls };
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
});/** Search listings by text (basic title/description match) */
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

    // Resolve image URLs from storage or keep external URLs as-is
    return Promise.all(
      results.map(async (listing) => {
        const imageUrls: string[] = [];
        if (listing.images) {
          for (const img of listing.images) {
            try {
              const url = await ctx.storage.getUrl(img);
              if (url) { imageUrls.push(url); continue; }
            } catch { /* not a storage key, try as external URL */ }
            if (typeof img === "string" && img.startsWith("http")) {
              imageUrls.push(img);
            }
          }
        }
        return { ...listing, images: imageUrls };
      })
    );
  },
});

/** Generate a Convex file storage upload URL for product images */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
