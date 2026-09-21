import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getSessionUser } from "./users";
import { MIN_DESCRIPTION_CHARS } from "./verification";

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

/**
 * Server-side list of allowed freelance categories (mirrors
 * src/lib/freelance-marketplace.ts). "bots" is kept so legacy rows keep
 * validating; new publishes use the current taxonomy.
 */
const FREELANCE_MARKETPLACE_CATEGORY_SLUGS = [
  "writing",
  "design",
  "video-photo",
  "marketing",
  "development",
  "data-research",
  "virtual-assistance",
  "education",
  "business-professional",
  "ai-accounts-tools",
  "digital-products",
  "other-services",
  // legacy slugs still stored on old rows
  "bots",
];

/**
 * Illegal-service guard for the freelance marketplace. Titles/descriptions
 * matching these patterns describe stolen accounts, cracked software,
 * credential sharing, exam fraud or fake credentials and are rejected at
 * publish time — the platform must never reward them.
 */
const ILLEGAL_SERVICE_PATTERNS = [
  "cracked", "crack", "patched", "keygen", "nulled", "torrent",
  "shared account", "account sharing", "shared login", "stolen account",
  "hacked account", "bypass", "activated free", "free activation",
  "assign my exam", "write my exam", "sit my exam", "exam impersonation",
  "impersonate", "fake certificate", "forged certificate", "fake degree",
  "fake transcripts", "buy followers", "buy likes", "bot followers",
  "buy subscribers", "fake reviews",
];

function findIllegalServiceText(text: string | undefined): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  return ILLEGAL_SERVICE_PATTERNS.find((k) => t.includes(k)) ?? null;
}

const marketplaceValidator = v.optional(
  v.union(v.literal("product"), v.literal("freelance"))
);

/** Normalise a marketplace value — missing/legacy rows are product listings. */
function normalizeMarketplace(m?: string): MarketplaceValue {
  return m === MARKETPLACE.FREELANCE ? MARKETPLACE.FREELANCE : MARKETPLACE.PRODUCT;
}

/**
 * ─── CATEGORY ALIASES & MARKET SECTIONS ───────────────────────────────────
 * Mirror of src/lib/market-sections.ts (Convex modules can't import from the
 * frontend lib). Keep both in sync. Aliases resolve legacy/duplicate slugs at
 * READ time so no listing is ever lost after the hierarchy consolidation.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  "animals-pets": "pets", // merged into Pets
  "school-education": "learning-books", // merged into Learning & Books
  jobs: "services", // employment is not a product
  "phones-tablets": "mobile-phones",
  electronics: "tvs-video",
  property: "rentals", // houses & apartments surface under Rentals
};

function canonicalCategory(slug?: string): string {
  if (!slug) return "";
  return CATEGORY_ALIASES[slug] ?? slug;
}

/** Leaf category slugs that surface inside each marketplace section. */
const SECTION_CATEGORY_SLUGS: Record<string, string[]> = {
  products: [
    "mobile-phones", "computers-laptops", "fashion", "home-living", "tvs-video",
    "health-beauty", "agriculture", "baby-kids", "gaming", "sports-fitness",
    "handmade-art", "learning-books", "business-industrial", "music-entertainment",
    "food-drinks", "pets",
  ],
  services: ["services"],
  stays: ["stays-experiences", "events-tickets"],
  rentals: ["rentals"],
};

const sectionValidator = v.optional(
  v.union(
    v.literal("products"),
    v.literal("services"),
    v.literal("stays"),
    v.literal("rentals"),
  )
);

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

/** Resolve document storage keys to displayable URLs (gracefully skips dead keys). */
async function resolveListingDocuments(ctx: any, docs: string[] | undefined): Promise<string[]> {
  const out: string[] = [];
  for (const doc of docs || []) {
    try {
      const url = await ctx.storage.getUrl(doc);
      if (url) { out.push(url); continue; }
    } catch { /* dead or invalid storage key — skip */ }
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
    documents: v.optional(v.array(v.string())),
    // Local Deals (#85 price history groundwork): the seller's "was" price.
    // Stored as-is; the deals feed only trusts it when it exceeds price.
    originalPrice: v.optional(v.number()),
    // ─── Phase 3: Wholesale (#63) & Rentals (#67) ───
    wholesale: v.optional(v.boolean()),
    moq: v.optional(v.number()),
    tierPrices: v.optional(v.array(v.object({ minQty: v.number(), price: v.number() }))),
    rental: v.optional(v.boolean()),
    ratePerDay: v.optional(v.number()),
    depositAmount: v.optional(v.number()),
    minRentalDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Always bind the listing to the session's OWN user — never an email
    // lookup that could resolve to an arbitrary (e.g. oldest anonymous) record.
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const marketplace = normalizeMarketplace(args.marketplace);

    // ── ROLE GATES: the two marketplaces have separate providers ──
    //  • Freelance services (Writer/Freelancer accounts) and Sellers may
    //    publish to the Freelance Marketplace.
    //  • Only Sellers publish physical products in the Normal Marketplace —
    //    a Writer/Freelancer never needs a store, and Buyers/Employers never
    //    publish either. Admin can act in both marketplaces.
    const role = (user as any).role as string | undefined;
    if (role === "admin") {
      // admins are allowed in both marketplaces (moderation/testing)
    } else if (marketplace === MARKETPLACE.FREELANCE) {
      if (role !== "freelancer" && role !== "seller") {
        throw new ConvexError(
          "Only Writer/Freelancer (or Seller) accounts can publish services to Nexora Freelance. Register as a Writer/Freelancer first."
        );
      }
    } else {
      if (role !== "seller") {
        throw new ConvexError(
          "Only Seller accounts can publish products in the Normal Marketplace."
        );
      }
    }

    // A freelance listing must use a freelance category so it is guaranteed to
    // show up only inside the Freelance Marketplace.
    if (marketplace === MARKETPLACE.FREELANCE && !FREELANCE_MARKETPLACE_CATEGORY_SLUGS.includes(args.category)) {
      throw new ConvexError("Freelance listings must use a Freelance Marketplace category (writing, design, video, marketing, web/software, data, virtual assistance, education, business, AI & digital tools, digital products or other services).");
    }

    // ── LIGHT ANTI-SPAM BAR (enforced server-side) ──
    // Keeps the description non-empty (blocks blank/junk posts) without any
    // real length requirement — sellers can publish a few words. Kept in sync
    // with MIN_DESCRIPTION_CHARS so the registration gate counts the listing.
    const trimmedDescription = (args.description || "").replace(/\s+/g, " ").trim();
    if (trimmedDescription.length < MIN_DESCRIPTION_CHARS) {
      throw new ConvexError(
        `Please add a short description (at least ${MIN_DESCRIPTION_CHARS} characters) so buyers know what they get.`
      );
    }

    // Illegal-service guard: never publish stolen accounts, cracked software,
    // credential sharing, exam fraud or fake credentials to the marketplace.
    if (marketplace === MARKETPLACE.FREELANCE) {
      const illegal =
        findIllegalServiceText(args.title) ??
        findIllegalServiceText(args.description);
      if (illegal) {
        throw new ConvexError(
          `This listing was rejected: "${illegal}" is not allowed on Nexora. Nexora only allows legitimate services and authorized software/tool subscriptions.`
        );
      }
    }

    const now = Date.now();
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
      documents: args.documents ?? [],
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
      originalPrice: args.originalPrice && args.originalPrice > args.price ? Math.round(args.originalPrice) : undefined,
      // Phase 3: wholesale + rental configuration (sanitized).
      wholesale:
        args.wholesale && args.moq && args.moq >= 2 &&
        args.tierPrices && args.tierPrices.length > 0 &&
        args.tierPrices.every((t) => t.minQty >= 2 && t.price > 0)
          ? true
          : undefined,
      moq: args.wholesale && args.moq && args.moq >= 2 ? Math.round(args.moq) : undefined,
      tierPrices: args.wholesale && args.tierPrices && args.tierPrices.length > 0
        ? args.tierPrices
            .filter((t) => t.minQty >= 2 && t.price > 0)
            .map((t) => ({ minQty: Math.round(t.minQty), price: Math.round(t.price) }))
            .sort((a, b) => a.minQty - b.minQty)
        : undefined,
      rental:
        args.rental && args.ratePerDay && args.ratePerDay > 0 &&
        args.depositAmount && args.depositAmount >= 0
          ? true
          : undefined,
      ratePerDay: args.rental && args.ratePerDay && args.ratePerDay > 0 ? Math.round(args.ratePerDay) : undefined,
      depositAmount: args.rental && args.depositAmount && args.depositAmount >= 0 ? Math.round(args.depositAmount) : undefined,
      minRentalDays: args.rental && args.minRentalDays && args.minRentalDays >= 1 ? Math.round(args.minRentalDays) : undefined,
      views: 0,
      favorites: 0,
      status: "active",
      createdAt: now,
    });

    const current = user.activeListings || 0;
    await ctx.db.patch(user._id, { activeListings: current + 1 });

    // ── Progressive verification: a new genuine listing may complete the
    // seller's business gate (KYC + real listing). Best-effort — publishing
    // must never fail because of verification bookkeeping.
    try {
      await ctx.runMutation(internal.verification.internalOnListingCreated, {
        userId: user._id,
      });
    } catch (err) {
      console.error("[verification] listing hook failed:", err);
    }

    // ── Notify the admin team of the new listing (in-app + email) ──
    // In-app: one notification per admin, always delivered to the bell.
    // Email: scheduled as a background action so publishing never blocks on
    // the mail provider; it no-ops safely when RESEND_API_KEY is unset.
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q: any) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "listing",
        title: marketplace === MARKETPLACE.FREELANCE ? "New freelance service published" : "New product published",
        message: `${args.sellerName || user.name || "A provider"} published "${args.title}" (KES ${args.price.toLocaleString()}) in the ${marketplace === MARKETPLACE.FREELANCE ? "Freelance" : "Normal"} Marketplace.`,
        read: false,
        link: marketplace === MARKETPLACE.FREELANCE ? `/freelance/service/${listingId}` : `/product/${listingId}`,
        createdAt: now,
      });
    }
    await ctx.scheduler.runAfter(0, api.notify.sendNewListingEmail, {
      title: args.title,
      price: args.price,
      marketplace,
      sellerName: args.sellerName || user.name || "A provider",
      listingId,
    });

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
    subcategory: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    condition: v.optional(v.string()),
    attributes: v.optional(v.record(v.string(), v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("sold"), v.literal("paused"), v.literal("removed"))),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new ConvexError("Listing not found");
    if (listing.sellerId !== user._id) throw new ConvexError("Not authorized");

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.price !== undefined) updates.price = args.price;
    if (args.subcategory !== undefined) updates.subcategory = args.subcategory;
    if (args.images !== undefined) updates.images = args.images;
    if (args.condition !== undefined) updates.condition = args.condition;
    if (args.attributes !== undefined) updates.attributes = args.attributes;
    if (args.status !== undefined) updates.status = args.status;
    updates.updatedAt = Date.now();

    await ctx.db.patch(args.listingId, updates);

    // A genuine-description edit can complete the seller's registration gate —
    // mirrors createListing so fixing up a thin listing lifts the gate too.
    try {
      await ctx.runMutation(internal.verification.internalOnListingCreated, {
        userId: user._id,
      });
    } catch (err) {
      console.error("[verification] listing update hook failed:", err);
    }

    return { success: true };
  },
});

/** Delete a listing */
export const deleteListing = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new ConvexError("Listing not found");
    if (listing.sellerId !== user._id) throw new ConvexError("Not authorized");

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

  // Resolve image URLs from storage or keep external URLs as-is
  return Promise.all(
    scoped.map(async (listing: any) => ({
      ...listing,
      images: await resolveListingImages(ctx, listing.images),
      documents: await resolveListingDocuments(ctx, listing.documents),
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

/**
 * Wholesale feed (#63): product listings offered B2B with MOQ + tiers.
 * Powers the Nexora Business supply discovery surface.
 */
export const getWholesaleListings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("listings")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .take(300);
    const rows = all
      .filter((l: any) => normalizeMarketplace((l as any).marketplace) === "product" && !!(l as any).wholesale)
      .slice(0, args.limit ?? 24);
    return Promise.all(
      rows.map(async (listing: any) => ({
        ...listing,
        images: await resolveListingImages(ctx, listing.images),
        documents: await resolveListingDocuments(ctx, listing.documents),
      })),
    );
  },
});

/**
 * Rentals feed (#67): items for hire — tools, tents, sound, cameras, vehicles.
 */
export const getRentalListings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("listings")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .take(300);
    const rows = all
      .filter((l: any) => normalizeMarketplace((l as any).marketplace) === "product" && !!(l as any).rental)
      .slice(0, args.limit ?? 24);
    return Promise.all(
      rows.map(async (listing: any) => ({
        ...listing,
        images: await resolveListingImages(ctx, listing.images),
        documents: await resolveListingDocuments(ctx, listing.documents),
      })),
    );
  },
});

/**
 * Local Deals feed (#85 groundwork): product listings with an honest "was"
 * price (originalPrice > price), biggest savings first. Real listings only —
 * no fake discounts; the discount is whatever the seller actually entered and
 * the escrow fee engine still applies to the real price.
 */
export const getDealsListings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("listings")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .order("desc")
      .take(300);
    const deals = all
      .filter((l: any) => {
        const mp = normalizeMarketplace((l as any).marketplace);
        return mp === "product" && typeof (l as any).originalPrice === "number" && (l as any).originalPrice > (l as any).price;
      })
      .sort((a: any, b: any) => (b.originalPrice - b.price) - (a.originalPrice - a.price))
      .slice(0, args.limit ?? 12);
    return Promise.all(
      deals.map(async (listing: any) => ({
        ...listing,
        images: await resolveListingImages(ctx, listing.images),
        documents: await resolveListingDocuments(ctx, listing.documents),
      })),
    );
  },
});

/** Get active FREELANCE listings — only ever shown in the Freelance Marketplace. */
export const getFreelanceListings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return getActiveListingsForMarketplace(ctx, MARKETPLACE.FREELANCE, args.limit ?? 50);
  },
});

/**
 * Public: all ACTIVE listings belonging to one user in one marketplace.
 * Powers the public freelancer profile page (their published services).
 */
export const getUserListings = query({
  args: {
    userId: v.string(),
    marketplace: marketplaceValidator,
  },
  handler: async (ctx, args) => {
    const marketplace = normalizeMarketplace(args.marketplace);
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", args.userId))
      .order("desc")
      .collect();

    const scoped = listings.filter(
      (l: any) => l.status === "active" && normalizeMarketplace(l.marketplace) === marketplace
    );

    return Promise.all(
      scoped.map(async (listing: any) => ({
        ...listing,
        images: await resolveListingImages(ctx, listing.images),
      documents: await resolveListingDocuments(ctx, listing.documents),
      }))
    );
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
      documents: await resolveListingDocuments(ctx, listing.documents),
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
      documents: await resolveListingDocuments(ctx, listing.documents),
    };
  },
});

/**
 * Get the seller's registered WhatsApp/phone number for a listing so buyers
 * can contact the seller directly on WhatsApp. Returns the phone exactly as
 * registered (normalized client-side); never returns any other user data.
 */
export const getSellerWhatsApp = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) return { phone: null, businessName: null };

    // Prefer the phone stored on the listing (set at publish time)
    const attrs = (listing as any).attributes as Record<string, any> | undefined;
    if (attrs?.SellerPhone && typeof attrs.SellerPhone === "string") {
      return {
        phone: attrs.SellerPhone,
        businessName: typeof attrs.BusinessName === "string" ? attrs.BusinessName : null,
      };
    }

    // Fall back to the seller account's registered phone. Wrapped so a
    // legacy/invalid sellerId (e.g. demo or system rows) can never fail the
    // whole product page — it just means "no phone on file".
    let seller: any = null;
    try {
      seller = await ctx.db.get(listing.sellerId as any);
    } catch {
      seller = null;
    }
    const phone =
      seller && "phone" in seller && typeof (seller as any).phone === "string"
        ? (seller as any).phone
        : null;
    const businessName =
      seller && "businessName" in seller && typeof (seller as any).businessName === "string"
        ? (seller as any).businessName
        : null;

    return { phone, businessName };
  },
});

/**
 * Record a real view. Deduplicated per viewer (signed-in user id or an
 * anonymous browser id) — one view per viewer per listing, ever. This keeps
 * the counter truthful: no refresh-spam, no render-loop inflation.
 */
export const incrementViews = mutation({
  args: {
    listingId: v.id("listings"),
    viewerKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) return;

    // Resolve the viewer: prefer the signed-in account, else the anonymous
    // browser key sent by the client.
    const sessionUser = await getSessionUser(ctx);
    const viewerKey =
      (sessionUser ? `user:${sessionUser._id}` : undefined) ??
      (args.viewerKey ? `anon:${args.viewerKey}` : undefined);
    if (!viewerKey) return; // no identifiable viewer — do not count

    const existing = await ctx.db
      .query("listingViews")
      .withIndex("by_listing_viewer", (q) =>
        q.eq("listingId", args.listingId).eq("viewerKey", viewerKey)
      )
      .first();

    if (existing) {
      // Already counted this viewer — refresh their timestamp only.
      await ctx.db.patch(existing._id, { viewedAt: Date.now() });
      return;
    }

    await ctx.db.insert("listingViews", {
      listingId: args.listingId,
      viewerKey,
      viewedAt: Date.now(),
    });
    await ctx.db.patch(args.listingId, { views: (listing.views || 0) + 1 });
  },
});

/**
 * Internal (CLI/server only): reset every listing's view counter to its real
 * unique-viewer count derived from the listingViews table. Used once to purge
 * the inflated numbers produced by the old render-loop counter.
 */
export const resetAllViewCounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db.query("listings").collect();
    const results: Array<{ id: string; views: number }> = [];
    for (const listing of listings) {
      const unique = await ctx.db
        .query("listingViews")
        .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
        .collect();
      await ctx.db.patch(listing._id, { views: unique.length });
      results.push({ id: listing._id, views: unique.length });
    }
    return results;
  },
});

/**
 * Internal (CLI/server only): wipe every view record and zero all counters.
 * Used to remove test/verification artifacts so the marketplace starts from an
 * honest 0 until real visitors arrive.
 */
export const clearAllViewRecords = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("listingViews").collect();
    for (const v of all) {
      await ctx.db.delete(v._id);
    }
    const listings = await ctx.db.query("listings").collect();
    for (const listing of listings) {
      await ctx.db.patch(listing._id, { views: 0 });
    }
    return { clearedViews: all.length, listings: listings.length };
  },
});

/** Search listings (defaults to the Normal product marketplace). */
export const searchListings = query({
  args: {
    query: v.string(),
    marketplace: marketplaceValidator,
    category: v.optional(v.string()),
    section: sectionValidator,
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

    // Category filter — alias-aware: legacy/duplicate slugs ("animals-pets",
    // "school-education", "jobs", "property", "electronics") keep resolving
    // to their canonical category, so no listing is ever lost.
    if (args.category) {
      const wanted = canonicalCategory(args.category);
      results = results.filter((l: any) => canonicalCategory(l.category) === wanted);
    }

    // Market-section filter — Products / Services / Stays / Rentals. Rentals
    // additionally includes any listing explicitly flagged rental: true.
    if (args.section) {
      const slugs = SECTION_CATEGORY_SLUGS[args.section] ?? [];
      results = results.filter((l: any) => {
        if (args.section === "rentals" && l.rental === true) return true;
        return slugs.includes(canonicalCategory(l.category));
      });
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

    // NEWEST FIRST — freshly published listings always surface at the top of
    // the market (matches the getActiveListings feed ordering), so a seller
    // who just publishes sees their product leading the marketplace.
    results.sort((a: any, b: any) => b._creationTime - a._creationTime);

    // Resolve image URLs from storage or keep external URLs as-is
    return Promise.all(
      results.map(async (listing: any) => ({
        ...listing,
        images: await resolveListingImages(ctx, listing.images),
      documents: await resolveListingDocuments(ctx, listing.documents),
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

    // NEWEST FIRST — newest freelance services surface at the top.
    results.sort((a: any, b: any) => b._creationTime - a._creationTime);

    const sliced = results.slice(0, args.limit ?? 60);

    return Promise.all(
      sliced.map(async (listing: any) => ({
        ...listing,
        images: await resolveListingImages(ctx, listing.images),
      documents: await resolveListingDocuments(ctx, listing.documents),
      }))
    );
  },
});


/** Generate a Convex file storage upload URL for product images */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
