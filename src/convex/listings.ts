import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getSessionUser } from "./users";

/**
 * Reserved owner for seeded demo listings. Demo content is never attached to a
 * real seller account, so it can never appear in a seller's "My Products".
 */
export const SYSTEM_SELLER_ID = "system";

/** Seller names used by the demo seed data (see seedListings.ts). */
const DEMO_SELLER_NAMES = ["Smart Fill Gas Point", "Stanish Gas Suppliers"];

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
    // Always bind the listing to the session's OWN user — never an email
    // lookup that could resolve to an arbitrary (e.g. oldest anonymous) record.
    const user = await getSessionUser(ctx);
    if (!user) throw new Error("Not authenticated");

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
    const user = await getSessionUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== user._id) throw new Error("Not authorized");

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
    const user = await getSessionUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== user._id) throw new Error("Not authorized");

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
    // Filter strictly by the session's own user record so "My Products" can
    // never show another account's listings.
    const user = await getSessionUser(ctx);
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

/**
 * Internal repair (CLI/server only — NOT callable from the client).
 *
 * Detaches seeded demo listings (Smart Fill Gas Point / Stanish Gas Suppliers)
 * from whatever real/anonymous seller they were misattributed to and moves them
 * to the reserved "system" seller. They stay visible in the marketplace feed
 * but can never appear in a real seller's "My Products". Also recomputes
 * activeListings for every affected seller.
 */
export const relocateDemoListings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("listings").collect();
    const affectedSellers = new Set<string>();
    let moved = 0;

    for (const listing of all) {
      const name = (listing as any).sellerName ?? "";
      if (DEMO_SELLER_NAMES.includes(name) && listing.sellerId !== SYSTEM_SELLER_ID) {
        affectedSellers.add(listing.sellerId);
        await ctx.db.patch(listing._id, { sellerId: SYSTEM_SELLER_ID } as any);
        moved++;
      }
    }

    for (const sellerId of affectedSellers) {
      const seller = await ctx.db.get(sellerId as any);
      if (!seller) continue;
      const active = await ctx.db
        .query("listings")
        .withIndex("by_seller", (q) => q.eq("sellerId", sellerId))
        .filter((f) => f.eq(f.field("status"), "active"))
        .collect();
      await ctx.db.patch(sellerId as any, { activeListings: active.length } as any);
    }

    return { moved, affectedSellers: Array.from(affectedSellers) };
  },
});
