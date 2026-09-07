import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getSessionUser } from "./users";

/**
 * Reserved owner for demo/system listings. Demo content is never attached to a
 * real seller account, so it can never appear in a seller's "My Products".
 */
export const SYSTEM_SELLER_ID = "system";

/**
 * Marketplace separation: every listing belongs to exactly one marketplace and
 * only ever surfaces there. Legacy rows without the field are treated as
 * "product" listings.
 *
 *  - product   → the Normal Marketplace  (/marketplace) — physical goods.
 *  - freelance → the Freelance Marketplace (/freelance) — services & digital tools.
 */
export const MARKETPLACE = {
  PRODUCT: "product",
  FREELANCE: "freelance",
} as const;
export type MarketplaceValue = (typeof MARKETPLACE)[keyof typeof MARKETPLACE];

/** Server-side list of allowed freelance categories (mirrors src/lib/freelance-marketplace.ts). */
const FREELANCE_MARKETPLACE_CATEGORY_SLUGS = [
  "ai-accounts-tools",
  "writing",
  "design",
  "development",
  "marketing",
  "bots",
  "other-services",
];

const marketplaceValidator = v.optional(
  v.union(v.literal("product"), v.literal("freelance"))
);

/** Normalise a marketplace value — missing/legacy rows are product listings. */
function normalizeMarketplace(m?: string): MarketplaceValue {
  return m === MARKETPLACE.FREELANCE ? MARKETPLACE.FREELANCE : MARKETPLACE.PRODUCT;
}

/** Resolve Convex storage keys / external image URLs to displayable URLs. */
async function resolveListingImages(ctx: any, images: string[] | undefined): Promise<string[]> {
  const out: string[] = [];
  for (const img of images || []) {
    try {
      const url = await ctx.storage.getUrl(img);
      if (url) { out.push(url); continue; }
    } catch { /* not a storage key, try as external URL */ }
    if (typeof img === "string" && img.startsWith("http")) {
      out.push(img);
    }
  }
  return out;
}

/** Create a new listing (seller adds product or freelance service) */
export const createListing = mutation({
  args: {
    marketplace: marketplaceValidator,
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

    // Sellers must be approved by an admin before they can publish products.
    const sellerStatus = (user as any).sellerStatus;
    if (sellerStatus === "pending") {
      throw new Error("Your store is awaiting admin approval. You cannot publish products yet.");
    }
    if (sellerStatus === "rejected") {
      throw new Error("Your store application was rejected. Please contact support.");
    }

    const marketplace = normalizeMarketplace(args.marketplace);

    // A freelance listing must use a freelance category so it is guaranteed to
    // show up only inside the Freelance Marketplace.
    if (marketplace === MARKETPLACE.FREELANCE && !FREELANCE_MARKETPLACE_CATEGORY_SLUGS.includes(args.category)) {
      throw new Error("Freelance listings must use a Freelance Marketplace category (AI tools, writing, design, development, marketing, bots or other services).");
    }

    const listingId = await ctx.db.insert("listings", {
      marketplace,
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

/**
 * Core feed logic shared by the Normal and Freelance marketplaces. Only active
 * listings from the requested marketplace are returned.
 */
async function getActiveListingsForMarketplace(ctx: any, marketplace: MarketplaceValue, limit: number) {
  const allActive = await ctx.db
    .query("listings")
    .withIndex("by_status", (q: any) => q.eq("status", "active"))
    .order("desc")
    .take(limit);

  const scoped = allActive.filter((l: any) => normalizeMarketplace(l.marketplace) === marketplace);

  // Hide listings from sellers whose store is not approved yet. The reserved
  // "system" seller (demo content) is always visible.
  const visible = await filterApprovedListings(ctx, scoped);

  // Resolve image URLs from storage or keep external URLs as-is
  return Promise.all(
    visible.map(async (listing: any) => ({
      ...listing,
      images: await resolveListingImages(ctx, listing.images),
    }))
  );
}

/** Get active listings (feed) — defaults to the Normal product marketplace. */
export const getActiveListings = query({
  args: {
    marketplace: marketplaceValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const marketplace = normalizeMarketplace(args.marketplace);
    return getActiveListingsForMarketplace(ctx, marketplace, args.limit ?? 50);
  },
});

/** Get active FREELANCE listings — only ever shown in the Freelance Marketplace. */
export const getFreelanceListings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return getActiveListingsForMarketplace(ctx, MARKETPLACE.FREELANCE, args.limit ?? 50);
  },
});

/** Get seller's own listings (all marketplaces — "My Products" area). */
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
      listings.map(async (listing: any) => ({
        ...listing,
        images: await resolveListingImages(ctx, listing.images),
      }))
    );
  },
});

/** Get a single listing by ID */
export const getListing = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) return null;

    return {
      ...listing,
      images: await resolveListingImages(ctx, listing.images),
    };
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

/** Search listings (defaults to the Normal product marketplace). */
export const searchListings = query({
  args: {
    query: v.string(),
    marketplace: marketplaceValidator,
    category: v.optional(v.string()),
    county: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    condition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const marketplace = normalizeMarketplace(args.marketplace);

    const allActive = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Scope to the requested marketplace FIRST so products and freelance
    // services can never bleed into each other across search/filters.
    let results = allActive.filter(
      (l: any) => normalizeMarketplace(l.marketplace) === marketplace
    );

    // Hide listings from sellers whose store is not approved yet.
    results = await filterApprovedListings(ctx, results);

    // Text search
    if (args.query) {
      const q = args.query.toLowerCase();
      results = results.filter(
        (l: any) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (args.category) {
      results = results.filter((l: any) => l.category === args.category);
    }

    // County filter
    if (args.county) {
      results = results.filter((l: any) => l.originCounty === args.county);
    }

    // Price filters
    if (args.minPrice !== undefined) {
      results = results.filter((l: any) => l.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      results = results.filter((l: any) => l.price <= args.maxPrice!);
    }

    // Condition filter
    if (args.condition) {
      results = results.filter((l: any) => l.condition === args.condition);
    }

    // Resolve image URLs from storage or keep external URLs as-is
    return Promise.all(
      results.map(async (listing: any) => ({
        ...listing,
        images: await resolveListingImages(ctx, listing.images),
      }))
    );
  },
});

/** Search freelance listings only — powering the Freelance Marketplace filters. */
export const searchFreelanceListings = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allActive = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let results = allActive.filter(
      (l: any) => normalizeMarketplace(l.marketplace) === MARKETPLACE.FREELANCE
    );

    results = await filterApprovedListings(ctx, results);

    if (args.query) {
      const q = args.query.toLowerCase();
      results = results.filter(
        (l: any) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          (l.subcategory || "").toLowerCase().includes(q)
      );
    }
    if (args.category) {
      results = results.filter((l: any) => l.category === args.category);
    }
    if (args.subcategory) {
      results = results.filter((l: any) => l.subcategory === args.subcategory);
    }
    if (args.minPrice !== undefined) {
      results = results.filter((l: any) => l.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      results = results.filter((l: any) => l.price <= args.maxPrice!);
    }

    const sliced = results.slice(0, args.limit ?? 60);

    return Promise.all(
      sliced.map(async (listing: any) => ({
        ...listing,
        images: await resolveListingImages(ctx, listing.images),
      }))
    );
  },
});

/**
 * Filter listings down to those whose seller store is approved (or is the
 * reserved demo "system" seller, or a legacy seller with no approval record).
 */
async function filterApprovedListings<T extends { sellerId: string }>(
  ctx: any,
  listings: T[]
): Promise<T[]> {
  const sellerIds = Array.from(new Set(listings.map((l) => l.sellerId))).filter(
    (id): id is string => id !== SYSTEM_SELLER_ID
  );
  const sellers = await Promise.all(
    sellerIds.map((id) => ctx.db.get(id as any))
  );
  const statusBySeller = new Map<string, string | undefined>();
  for (const s of sellers) {
    if (s) statusBySeller.set((s as any)._id, (s as any).sellerStatus);
  }

  return listings.filter((l) => {
    if (l.sellerId === SYSTEM_SELLER_ID) return true; // demo content
    const status = statusBySeller.get(l.sellerId);
    return status !== "pending" && status !== "rejected";
  });
}

/** Generate a Convex file storage upload URL for product images */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
