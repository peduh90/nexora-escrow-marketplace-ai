import { getAuthUserId } from "@convex-dev/auth/server";
import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { sellerCommission, buyerProtectionFee, resolveFee, recordFeeEarning } from "./fees";

// ─── LOCAL SERVICES (Kenya-first, simple English) ───────────────────────────
//
// Everyday providers — salons, plumbers, mechanics, cleaners — on the same
// trust rails as the rest of Nexora: session-bound profiles, escrow-funded
// bookings through the existing wallet + fee engine, real ratings only.
// No seeded/demo rows are ever created here.

/**
 * The simple, ordinary-Kenyan service categories — ordered by everyday
 * demand. Transport types (Boda, Matatu) link into the transport system;
 * everything else books through the escrow-protected service flow.
 */
export const SERVICE_CATEGORIES = [
  {
    slug: "boda",
    name: "Boda Boda & Rides",
    emoji: "🏍️",
    types: ["Boda Boda", "Taxi", "Tuk-Tuk", "Car Hire"],
  },
  {
    slug: "matatu",
    name: "Matatu & Transport",
    emoji: "🚐",
    types: ["Matatu", "Truck & Van Hire", "Shuttle Services"],
  },
  {
    slug: "delivery",
    name: "Moving & Delivery",
    emoji: "📦",
    types: ["Parcel Delivery", "Courier", "Moving & House Shifting", "Errands", "Shopping Delivery"],
  },
  {
    slug: "plumbers",
    name: "Plumbers",
    emoji: "🚰",
    types: ["Plumber", "Water Tank Cleaning", "Drain Unblocking", "Pipe Installation"],
  },
  {
    slug: "electricians",
    name: "Electricians",
    emoji: "⚡",
    types: ["Electrician", "Wiring", "Solar Installation", "Appliance Hookup"],
  },
  {
    slug: "auto",
    name: "Mechanics & Car Repair",
    emoji: "🔧",
    types: ["Mechanic", "Car Wash", "Tyre Services", "Spare Parts", "Battery Services"],
  },
  {
    slug: "cleaning",
    name: "Cleaning Services",
    emoji: "🧹",
    types: ["House Cleaning", "Office Cleaning", "Carpet Cleaning", "Fumigation & Pest Control"],
  },
  {
    slug: "laundry",
    name: "Laundry & Ironing",
    emoji: "👕",
    types: ["Laundry", "Ironing", "Dry Cleaning", "Shoe Cleaning"],
  },
  {
    slug: "beauty",
    name: "Salon & Barber",
    emoji: "💈",
    types: ["Salon", "Barber", "Braiding", "Nails", "Facial", "Massage", "Spa"],
  },
  {
    slug: "makeup",
    name: "Beauty & Makeup",
    emoji: "💅",
    types: ["Makeup Artist", "Bridal Makeup", "Beauty Products", "Henna Art"],
  },
  {
    slug: "home",
    name: "Home Repairs & Maintenance",
    emoji: "🏠",
    types: ["Handyman", "Painting", "Roof Repair", "Furniture Repair", "Repairs"],
  },
  {
    slug: "fundis",
    name: "Construction & Fundis",
    emoji: "🧱",
    types: ["Mason / Fundi", "Carpenter", "Welder", "Roofing", "Tiling", "Construction Worker"],
  },
  {
    slug: "tech-repair",
    name: "Computer & Phone Repair",
    emoji: "📱",
    types: ["Phone Repair", "Computer Repair", "Software Installation", "Virus Removal"],
  },
  {
    slug: "cyber",
    name: "Printing, Photocopy & Cyber",
    emoji: "🖨️",
    types: ["Printing", "Photocopying", "Cyber Services", "Lamination", "Binding", "Photo Studio"],
  },
  {
    slug: "courier",
    name: "Courier & Parcel Delivery",
    emoji: "🚚",
    types: ["Same-Day Courier", "Inter-County Parcel", "Document Delivery"],
  },
  {
    slug: "carhire",
    name: "Car & Truck Hire",
    emoji: "🚗",
    types: ["Car Hire", "Truck Hire", "Van Hire", "Driver Hire"],
  },
  {
    slug: "events",
    name: "Events & Equipment Hire",
    emoji: "🎉",
    types: ["Tents & Chairs Hire", "Sound System", "MC", "DJ", "Catering", "Decor", "Photography & Video"],
  },
  {
    slug: "photography",
    name: "Photography & Videography",
    emoji: "📸",
    types: ["Photographer", "Videographer", "Drone Shots", "Photo Editing"],
  },
  {
    slug: "appliance",
    name: "Appliance Repair",
    emoji: "🔌",
    types: ["Fridge Repair", "TV Repair", "Washing Machine Repair", "Microwave Repair"],
  },
  {
    slug: "garden",
    name: "Gardening & Landscaping",
    emoji: "🌿",
    types: ["Gardener", "Landscaping", "Lawn Mowing", "Tree Trimming"],
  },
  {
    slug: "waste",
    name: "Waste Collection",
    emoji: "🗑️",
    types: ["Household Waste", "Business Waste", "Compound Cleaning"],
  },
  {
    slug: "water",
    name: "Water Delivery",
    emoji: "💧",
    types: ["Water Bowser", "Drinking Water Refill", "Water Vending"],
  },
  {
    slug: "gas",
    name: "Gas / LPG Delivery",
    emoji: "🔥",
    types: ["Gas Refill", "Gas Delivery", "Cooking Oil Delivery"],
  },
  {
    slug: "tutoring",
    name: "Tutoring & Education",
    emoji: "📚",
    types: ["Home Tutor", "Exam Prep (KCPE/KCSE)", "Music Lessons", "Computer Classes"],
  },
  {
    slug: "childcare",
    name: "Childcare & Domestic Help",
    emoji: "👶",
    types: ["House Help / Mboch", "Nanny", "Baby Sitter", "House Manager"],
  },
  {
    slug: "pets",
    name: "Pet Services",
    emoji: "🐕",
    types: ["Dog Walking", "Veterinary", "Pet Grooming", "Pet Sitting"],
  },
  {
    slug: "professional",
    name: "Professional Services",
    emoji: "💼",
    types: ["Lawyer", "Accountant", "IT Support", "Business Consultant", "Agri Consultant"],
  },
  {
    slug: "marketing",
    name: "Business & Marketing Services",
    emoji: "📈",
    types: ["Marketing Agent", "Branding", "Social Media Management", "Business Registration"],
  },
  {
    slug: "emergency",
    name: "Emergency Services",
    emoji: "🚨",
    types: ["Locksmith (Locked Out)", "Emergency Plumber", "Emergency Electrician", "Towing", "Roadside Rescue"],
  },
] as const;

/** Session user (auth-bound, email fallback) — same rule as the rest of the app. */
async function getSessionUser(ctx: any): Promise<any | null> {
  const userId = await getAuthUserId(ctx);
  if (userId !== null) {
    const user = await ctx.db.get(userId);
    if (user) return user;
  }
  const identity = await ctx.auth.getUserIdentity();
  const email = typeof identity?.email === "string" ? identity.email : null;
  if (email && email.length > 0) {
    const rows = await ctx.db
      .query("users")
      .withIndex("email" as any, (q: any) => q.eq("email", email))
      .collect();
    if (rows.length > 0) return rows[0];
  }
  return null;
}

async function requireUser(ctx: any): Promise<any> {
  const user = await getSessionUser(ctx);
  if (!user) throw new ConvexError("Not authenticated");
  return user;
}

async function notify(ctx: any, userId: string, title: string, message: string, link: string) {
  await ctx.db.insert("notifications", {
    userId,
    type: "services",
    title,
    message,
    read: false,
    link,
    createdAt: Date.now(),
  });
}

// ─── PUBLIC DISCOVERY ───────────────────────────────────────────────────────

/** Category list for the homepage "Services Near You" grid (static config). */
export const getCategories = query({
  args: {},
  handler: async () => SERVICE_CATEGORIES,
});

/** Public shape for a provider card — never leaks contact details. */
async function toPublicProvider(ctx: any, p: any) {
  const user = await ctx.db.get(p.userId as any);
  return {
    _id: p._id,
    displayName: p.displayName,
    category: p.category,
    serviceType: p.serviceType,
    tagline: p.tagline,
    county: p.county,
    town: p.town,
    coverageAreas: p.coverageAreas,
    pricingMode: p.pricingMode,
    basePrice: p.basePrice,
    availability: p.availability,
    workingHours: p.workingHours,
    adminVerified: !!p.adminVerified,
    rating: p.ratingCount ? Math.round(((p.ratingSum || 0) / p.ratingCount) * 10) / 10 : null,
    ratingCount: p.ratingCount || 0,
    completedJobs: p.completedJobs || 0,
    verified: !!p.adminVerified || (user as any)?.verificationLevel === "business",
    image: p.image ?? (user as any)?.image ?? undefined,
    // Direct WhatsApp contact — customers can chat with the provider outside
    // the escrow flow if they prefer. Only shared when the provider listed a
    // number.
    whatsapp: p.whatsapp ?? (user as any)?.whatsapp ?? undefined,
    phone: p.phone ?? undefined,
    description: p.description,
    createdAt: p.createdAt,
  };
}

/** Providers in one category (homepage + category page). */
export const getProvidersByCategory = query({
  args: { category: v.string(), availableNow: v.optional(v.boolean()), county: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let rows = await ctx.db
      .query("serviceProfiles")
      .withIndex("by_category" as any, (q: any) => q.eq("category", args.category))
      .collect();
    if (args.availableNow) {
      rows = rows.filter((p: any) => p.availability === "available_now");
    }
    if (args.county) {
      const c = args.county.trim().toLowerCase();
      if (c) rows = rows.filter((p: any) => (p.county || "").toLowerCase() === c);
    }
    const out = await Promise.all(rows.map((p: any) => toPublicProvider(ctx, p)));
    // Verified first, then available, then rating, then newest.
    out.sort((a: any, b: any) =>
      (b.verified ? 1 : 0) - (a.verified ? 1 : 0) ||
      (b.availability === "available_now" ? 1 : 0) - (a.availability === "available_now" ? 1 : 0) ||
      (b.rating ?? 0) - (a.rating ?? 0) ||
      b.createdAt - a.createdAt,
    );
    return out;
  },
});

/** Simple text search across service type, name, town, county, tagline. */
export const searchProviders = query({
  args: { q: v.string(), category: v.optional(v.string()), county: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const needle = args.q.trim().toLowerCase();
    if (!needle) return [];
    let rows = await ctx.db.query("serviceProfiles").collect();
    if (args.category) rows = rows.filter((p: any) => p.category === args.category);
    if (args.county) {
      const c = args.county.trim().toLowerCase();
      if (c) rows = rows.filter((p: any) => (p.county || "").toLowerCase() === c);
    }
    const matched = rows.filter((p: any) =>
      [p.serviceType, p.displayName, p.town, p.county, p.tagline, p.category]
        .some((f: any) => typeof f === "string" && f.toLowerCase().includes(needle)),
    );
    const out = await Promise.all(matched.map((p: any) => toPublicProvider(ctx, p)));
    out.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
    return out.slice(0, 40);
  },
});

/** "Available Now" strip: verified/available providers across all categories. */
export const getAvailableNow = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("serviceProfiles")
      .withIndex("by_availability" as any, (q: any) => q.eq("availability", "available_now"))
      .collect();
    const out = await Promise.all(rows.map((p: any) => toPublicProvider(ctx, p)));
    out.sort((a: any, b: any) =>
      (b.verified ? 1 : 0) - (a.verified ? 1 : 0) || (b.rating ?? 0) - (a.rating ?? 0),
    );
    return out.slice(0, args.limit ?? 12);
  },
});

/** "Popular Services": most completed real jobs per service type. */
export const getPopularServices = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("serviceProfiles").collect();
    const byType = new Map<string, { serviceType: string; category: string; jobs: number; rating: number; count: number }>();
    for (const p of rows) {
      const key = `${p.category}:${p.serviceType}`;
      const cur = byType.get(key) || { serviceType: p.serviceType, category: p.category, jobs: 0, rating: 0, count: 0 };
      cur.jobs += p.completedJobs || 0;
      if (p.ratingCount) {
        cur.rating += (p.ratingSum || 0) / p.ratingCount;
        cur.count += 1;
      }
      byType.set(key, cur);
    }
    return [...byType.values()]
      .map((t) => ({ ...t, rating: t.count ? Math.round((t.rating / t.count) * 10) / 10 : null }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, args.limit ?? 8);
  },
});

/** One provider (public profile page). */
export const getProvider = query({
  args: { providerId: v.id("serviceProfiles") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.providerId);
    if (!p) return null;
    return toPublicProvider(ctx, p);
  },
});

/** Real rating history for one provider (from the shared reviews table). */
export const getProviderReviews = query({
  args: { providerId: v.id("serviceProfiles") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_seller" as any, (q: any) => q.eq("sellerId", args.providerId))
      .order("desc")
      .take(50);
    return Promise.all(
      reviews.map(async (r: any) => {
        const author = await ctx.db.get(r.userId as any);
        return {
          _id: r._id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          authorName: (author as any)?.name || "Nexora user",
        };
      }),
    );
  },
});

// ─── PROVIDER: MY SERVICE (dashboard data) ──────────────────────────────────

/** The signed-in user's own provider profile + live booking queue. */
export const getMyService = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("serviceProfiles")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .first();
    const requests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_provider_user" as any, (q: any) => q.eq("providerUserId", user._id))
      .order("desc")
      .take(100);
    const withCustomer = await Promise.all(
      requests.map(async (r: any) => {
        const c = await ctx.db.get(r.customerId as any);
        return {
          ...r,
          customerName: (c as any)?.name || "Customer",
          customerPhone: (c as any)?.phone || null,
        };
      }),
    );
    const completed = withCustomer.filter((r: any) => r.status === "completed");
    const earnings = completed.reduce((s: number, r: any) => s + (r.payout ?? 0), 0);
    return { profile: profile ?? null, requests: withCustomer, completedCount: completed.length, earnings };
  },
});

/** Customer view: my bookings with the provider's display name + phone. */
export const getMyBookings = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const requests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_customer" as any, (q: any) => q.eq("customerId", user._id))
      .order("desc")
      .take(100);
    return Promise.all(
      requests.map(async (r: any) => {
        const p = await ctx.db.get(r.providerId as any);
        const pu = await ctx.db.get(r.providerUserId as any);
        return {
          ...r,
          providerName: (p as any)?.displayName || (pu as any)?.name || "Provider",
          providerPhone: (p as any)?.phone || (pu as any)?.phone || null,
        };
      }),
    );
  },
});

// ─── PROVIDER: CREATE / UPDATE SERVICE ──────────────────────────────────────

/** Register or update the user's local-service profile. One per account. */
export const upsertMyService = mutation({
  args: {
    displayName: v.string(),
    category: v.string(),
    serviceType: v.string(),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    county: v.string(),
    town: v.string(),
    coverageAreas: v.optional(v.array(v.string())),
    serviceRadiusKm: v.optional(v.number()),
    pricingMode: v.union(v.literal("fixed"), v.literal("starting_from"), v.literal("quote")),
    basePrice: v.optional(v.number()),
    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    image: v.optional(v.string()),
    workingHours: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const category = SERVICE_CATEGORIES.find((c) => c.slug === args.category);
    if (!category) throw new ConvexError("Unknown service category");
    if (!(category.types as readonly string[]).includes(args.serviceType)) {
      throw new ConvexError(`"${args.serviceType}" is not in the ${category.name} list`);
    }
    if (args.pricingMode !== "quote" && (!args.basePrice || args.basePrice < 50)) {
      throw new ConvexError("Set a price of at least KES 50, or choose 'Customer asks first'");
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("serviceProfiles")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .first();
    const payload: Record<string, any> = {
      displayName: args.displayName.trim(),
      category: args.category,
      serviceType: args.serviceType,
      tagline: args.tagline?.trim() || undefined,
      description: args.description?.trim() || undefined,
      county: args.county,
      town: args.town,
      coverageAreas: args.coverageAreas,
      serviceRadiusKm: args.serviceRadiusKm,
      pricingMode: args.pricingMode,
      basePrice: args.pricingMode === "quote" ? undefined : Math.round(args.basePrice!),
      phone: args.phone,
      whatsapp: args.whatsapp,
      image: args.image,
      workingHours: args.workingHours,
      updatedAt: now,
    };
    if (existing) {
      // Re-editing keeps the verification state unless core identity changed.
      const coreChanged =
        (existing as any).category !== args.category ||
        (existing as any).serviceType !== args.serviceType;
      await ctx.db.patch((existing as any)._id, {
        ...payload,
        ...(coreChanged ? { adminVerified: false, verificationNote: "Re-verification needed after service change" } : {}),
      });
      return { profileId: (existing as any)._id, created: false };
    }
    const id = await ctx.db.insert("serviceProfiles", {
      ...payload,
      userId: user._id,
      availability: "off" as any,
      adminVerified: false,
      ratingSum: 0,
      ratingCount: 0,
      completedJobs: 0,
      views: 0,
      createdAt: now,
    } as any);

    // Admins get a real verification task in their panel flow (notification).
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role" as any, (q: any) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await notify(ctx, admin._id, "New local service to verify", `${args.displayName} (${args.serviceType}) registered in ${category.name}, ${args.town}.`, "/admin/services");
    }
    return { profileId: id, created: true };
  },
});

/** Toggle availability — drives the homepage "Available Now" indicators. */
export const setMyAvailability = mutation({
  args: { availability: v.union(v.literal("available_now"), v.literal("busy"), v.literal("off")) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("serviceProfiles")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .first();
    if (!profile) throw new ConvexError("Create your service profile first");
    await ctx.db.patch((profile as any)._id, { availability: args.availability, updatedAt: Date.now() });
    return { success: true };
  },
});

// ─── CUSTOMER: BOOK & PAY (escrow via the shared fee engine) ────────────────

/** Customer requests a service. Price comes from the provider's stored profile. */
export const requestService = mutation({
  args: {
    providerId: v.id("serviceProfiles"),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    county: v.optional(v.string()),
    town: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await ctx.db.get(args.providerId);
    if (!provider) throw new ConvexError("Service not found");
    const p = provider as any;
    if (p.userId === user._id) throw new ConvexError("You cannot book your own service");
    if (p.availability === "off") throw new ConvexError("This provider is not accepting requests right now");

    if (p.pricingMode === "quote") {
      throw new ConvexError("This provider prices per job — use Chat to agree the price first.");
    }
    const amount = Math.round(p.basePrice as number);
    const now = Date.now();

    const id = await ctx.db.insert("serviceRequests", {
      providerId: args.providerId,
      providerUserId: p.userId,
      customerId: user._id,
      category: p.category,
      serviceType: p.serviceType,
      title: args.title.trim() || `${p.serviceType} service`,
      description: args.description?.trim() || undefined,
      location: args.location?.trim() || undefined,
      county: args.county || p.county,
      town: args.town || p.town,
      amount,
      currency: "KES",
      status: "pending" as any,
      createdAt: now,
    });

    await notify(
      ctx,
      p.userId,
      "New service request",
      `${(user as any).name || "A customer"} requested "${args.title}" — KES ${amount.toLocaleString()} waiting for your acceptance.`,
      "/services/dashboard",
    );
    return { requestId: id };
  },
});

/**
 * Customer funds escrow for the request: amount + buyer protection fee from
 * the NORMAL marketplace tiers (services are local, consumer transactions).
 * Money moves wallet → escrow; the provider sees "funded" and accepts.
 */
export const fundServiceRequest = mutation({
  args: { requestId: v.id("serviceRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new ConvexError("Request not found");
    const r = req as any;
    if (r.customerId !== user._id) throw new ConvexError("Not authorized");
    if (r.status !== "pending") throw new ConvexError("This request is no longer awaiting payment");

    const amount = r.amount;
    const protectionResolved = await resolveFee(ctx.db, "services", "buyer_protection", amount);
    const protection = protectionResolved.breakdown;
    const total = amount + protection.fee;
    const walletBalance = (user as any).walletBalance || 0;
    if (walletBalance < total) {
      throw new ConvexError(
        `You need KES ${total.toLocaleString()} in your wallet (service KES ${amount.toLocaleString()} + protection KES ${protection.fee.toLocaleString()}). Deposit with M-Pesa first.`,
      );
    }
    const now = Date.now();
    await ctx.db.patch(user._id, {
      walletBalance: walletBalance - total,
      escrowBalance: ((user as any).escrowBalance || 0) + total,
    });
    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "escrow_fund" as any,
      amount: total,
      currency: "KES",
      status: "completed" as any,
      reference: `NX-SVC-ESC-${now}`,
      description: `Escrow for "${r.title}" (incl. KES ${protection.fee.toLocaleString()} protection)`,
      createdAt: now,
    });
    await ctx.db.patch(args.requestId, { status: "funded" as any, customerFunded: true, updatedAt: now });

    await notify(
      ctx,
      r.providerUserId,
      "Payment secured in escrow",
      `"${r.title}" is funded — KES ${amount.toLocaleString()} is held safely. Accept to start.`,
      "/services/dashboard",
    );
    return { success: true, total };
  },
});

/** Provider accepts a funded request. */
export const acceptServiceRequest = mutation({
  args: { requestId: v.id("serviceRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new ConvexError("Request not found");
    const r = req as any;
    if (r.providerUserId !== user._id) throw new ConvexError("Not authorized");
    if (r.status !== "funded") throw new ConvexError("Wait for the customer's escrow payment first");
    const now = Date.now();
    await ctx.db.patch(args.requestId, { status: "accepted" as any, providerAcceptedAt: now, updatedAt: now });
    await notify(ctx, r.customerId, "Provider accepted", `Your "${r.title}" request was accepted. Track it in Bookings.`, "/services/bookings");
    return { success: true };
  },
});

/** Provider declines a pending request (before funding or after, refunding). */
export const declineServiceRequest = mutation({
  args: { requestId: v.id("serviceRequests"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new ConvexError("Request not found");
    const r = req as any;
    if (r.providerUserId !== user._id) throw new ConvexError("Not authorized");
    if (!["pending", "funded"].includes(r.status)) throw new ConvexError("Only fresh requests can be declined");
    const now = Date.now();

    if (r.status === "funded") {
      // Refund escrow to the customer (amount + protection).
      const customer = await ctx.db.get(r.customerId as any);
      const protection = buyerProtectionFee("product", r.amount);
      const refund = r.amount + protection.fee;
      await ctx.db.patch(r.customerId as any, {
        escrowBalance: Math.max(0, ((customer as any).escrowBalance || 0) - refund),
        walletBalance: ((customer as any).walletBalance || 0) + refund,
      });
      await ctx.db.insert("walletTransactions", {
        userId: r.customerId,
        type: "refund" as any,
        amount: refund,
        currency: "KES",
        status: "completed" as any,
        reference: `NX-SVC-REF-${now}`,
        description: `Refund — provider declined "${r.title}"`,
        createdAt: now,
      });
      await notify(ctx, r.customerId, "Request declined & refunded", `The provider declined "${r.title}". KES ${refund.toLocaleString()} is back in your wallet.`, "/services/bookings");
    } else {
      await notify(ctx, r.customerId, "Request declined", `The provider declined "${r.title}". Try another provider nearby.`, "/services");
    }
    await ctx.db.patch(args.requestId, { status: "declined" as any, declinedReason: args.reason, updatedAt: now });
    return { success: true };
  },
});

/** Customer cancels a request that hasn't been started. */
export const cancelServiceRequest = mutation({
  args: { requestId: v.id("serviceRequests"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new ConvexError("Request not found");
    const r = req as any;
    if (r.customerId !== user._id) throw new ConvexError("Not authorized");
    if (!["pending", "funded", "accepted"].includes(r.status)) throw new ConvexError("Work already started — use a dispute");
    const now = Date.now();
    if (r.status !== "pending") {
      const customer = await ctx.db.get(r.customerId as any);
      const protection = buyerProtectionFee("product", r.amount);
      const refund = r.amount + protection.fee;
      await ctx.db.patch(r.customerId as any, {
        escrowBalance: Math.max(0, ((customer as any).escrowBalance || 0) - refund),
        walletBalance: ((customer as any).walletBalance || 0) + refund,
      });
      await ctx.db.insert("walletTransactions", {
        userId: r.customerId,
        type: "refund" as any,
        amount: refund,
        currency: "KES",
        status: "completed" as any,
        reference: `NX-SVC-CXL-${now}`,
        description: `Refund — cancelled "${r.title}"`,
        createdAt: now,
      });
      await notify(ctx, r.providerUserId, "Booking cancelled", `"${r.title}" was cancelled by the customer. Escrow refunded.`, "/services/dashboard");
    }
    await ctx.db.patch(args.requestId, { status: "cancelled" as any, cancelledBy: user._id, cancelReason: args.reason, updatedAt: now });
    return { success: true };
  },
});

/** Provider marks the job started. */
export const startServiceRequest = mutation({
  args: { requestId: v.id("serviceRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new ConvexError("Request not found");
    const r = req as any;
    if (r.providerUserId !== user._id) throw new ConvexError("Not authorized");
    if (r.status !== "accepted") throw new ConvexError("Accept the booking first");
    const now = Date.now();
    await ctx.db.patch(args.requestId, { status: "in_progress" as any, startedAt: now, updatedAt: now });
    await notify(ctx, r.customerId, "Work started", `The provider started "${r.title}". You'll confirm when it's done.`, "/services/bookings");
    return { success: true };
  },
});

/**
 * Customer confirms completion — the payment moment. Escrow releases; the
 * provider is paid net of the seller commission (same tiers as products);
 * real revenue flows through the platform fee engine.
 */
export const completeServiceRequest = mutation({
  args: { requestId: v.id("serviceRequests"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new ConvexError("Request not found");
    const r = req as any;
    if (r.customerId !== user._id) throw new ConvexError("Only the customer can confirm completion");
    if (!["in_progress", "accepted", "funded"].includes(r.status)) {
      throw new ConvexError("This booking is not in an active state");
    }
    if (!r.customerFunded) throw new ConvexError("Escrow was never funded for this request");

    const now = Date.now();
    const amount = r.amount;
    const commissionResolved = await resolveFee(ctx.db, "services", "seller_commission", amount);
    const protectionResolved = await resolveFee(ctx.db, "services", "buyer_protection", amount);
    const commission = commissionResolved.breakdown;
    const protection = protectionResolved.breakdown;
    const payout = amount - commission.fee;

    // Ledger: service commission + protection realized at release.
    try {
      await recordFeeEarning(ctx.db, {
        sourceType: "service_release",
        marketplace: "services",
        feeType: "seller_commission",
        ruleKey: commissionResolved.ruleKey,
        ruleRate: commissionResolved.ruleRate,
        amount: commission.fee,
        baseAmount: amount,
        requestId: r._id,
        buyerId: r.customerId,
        sellerId: r.providerUserId,
        description: `Service provider commission on "${r.title}"`,
      });
      await recordFeeEarning(ctx.db, {
        sourceType: "service_release",
        marketplace: "services",
        feeType: "buyer_protection",
        ruleKey: protectionResolved.ruleKey,
        ruleRate: protectionResolved.ruleRate,
        amount: protection.fee,
        baseAmount: amount,
        requestId: r._id,
        buyerId: r.customerId,
        sellerId: r.providerUserId,
        description: `Buyer protection fee on "${r.title}"`,
      });
    } catch (err) {
      console.error("[fees] ledger insert failed (service_release):", err);
    }

    const customer = await ctx.db.get(r.customerId as any);
    await ctx.db.patch(r.customerId as any, {
      escrowBalance: Math.max(0, ((customer as any).escrowBalance || 0) - (amount + protection.fee)),
    });

    const provider: any = await ctx.db.get(r.providerUserId as any);
    if (provider) {
      await ctx.db.patch(provider._id, { walletBalance: (provider.walletBalance || 0) + payout });
      await ctx.db.insert("walletTransactions", {
        userId: provider._id,
        type: "escrow_release" as any,
        amount: payout,
        currency: "KES",
        status: "completed" as any,
        reference: `NX-SVC-REL-${now}`,
        description: `Payment for "${r.title}" (gross KES ${amount.toLocaleString()} − ${(commission.rate * 100).toFixed(1)}% commission KES ${commission.fee.toLocaleString()})`,
        createdAt: now,
      });
      const prof = await ctx.db.get(r.providerId as any);
      await ctx.db.patch(r.providerId as any, {
        completedJobs: ((prof as any).completedJobs || 0) + 1,
        updatedAt: now,
      });
    }

    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "escrow_release" as any,
      amount,
      currency: "KES",
      status: "completed" as any,
      reference: `NX-SVC-DONE-${now}`,
      description: `Escrow released for "${r.title}"`,
      createdAt: now,
    });

    // Referral hook: a real completed services transaction.
    try {
      await ctx.runMutation(internal.referral.internalOnEscrowReleased, {
        participantIds: [r.customerId, r.providerUserId].filter(Boolean),
        escrowId: args.requestId,
        amount,
        currency: "KES",
      });
    } catch (err) {
      console.error("[referral] services release hook failed:", err);
    }

    await ctx.db.patch(args.requestId, {
      status: "completed" as any,
      completedAt: now,
      completionNote: args.note?.trim() || undefined,
      payout,
      updatedAt: now,
    });
    await notify(ctx, r.providerUserId, "💰 Payment released!", `"${r.title}" is complete. KES ${payout.toLocaleString()} (net of commission) is in your wallet.`, "/services/dashboard");
    return { success: true, payout };
  },
});

// ─── RATINGS (real, completed bookings only) ────────────────────────────────

/** Customer rates a completed service. Updates the provider's live aggregate. */
export const rateServiceRequest = mutation({
  args: { requestId: v.id("serviceRequests"), rating: v.number(), comment: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.rating < 1 || args.rating > 5) throw new ConvexError("Rating must be 1–5");
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new ConvexError("Request not found");
    const r = req as any;
    if (r.customerId !== user._id) throw new ConvexError("Not authorized");
    if (r.status !== "completed") throw new ConvexError("You can only rate completed services");
    if (r.ratedAt) throw new ConvexError("You already rated this service");

    const now = Date.now();
    await ctx.db.patch(args.requestId, { rating: args.rating, ratedAt: now });
    const prof = await ctx.db.get(r.providerId as any);
    await ctx.db.patch(r.providerId as any, {
      ratingSum: ((prof as any).ratingSum || 0) + args.rating,
      ratingCount: ((prof as any).ratingCount || 0) + 1,
      updatedAt: now,
    });
    await notify(ctx, r.providerUserId, "You got a new rating", `${args.rating}★ for "${r.title}"${args.comment ? ` — "${args.comment}"` : ""}`, "/services/dashboard");
    return { success: true };
  },
});

// ─── ADMIN VERIFICATION ─────────────────────────────────────────────────────

/** Admin guard. */
async function requireAdmin(ctx: any): Promise<any> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new ConvexError("Unauthorized: admin only");
  return user;
}

/** Admin: all service profiles with stats (admin → Local Services page). */
export const adminListProviders = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("serviceProfiles").order("desc").collect();
    return Promise.all(
      rows.map(async (p: any) => {
        const u = await ctx.db.get(p.userId as any);
        return {
          _id: p._id,
          displayName: p.displayName,
          serviceType: p.serviceType,
          category: p.category,
          county: p.county,
          town: p.town,
          basePrice: p.basePrice,
          pricingMode: p.pricingMode,
          availability: p.availability,
          adminVerified: !!p.adminVerified,
          completedJobs: p.completedJobs || 0,
          rating: p.ratingCount ? Math.round(((p.ratingSum || 0) / p.ratingCount) * 10) / 10 : null,
          ownerName: (u as any)?.name || "",
          ownerEmail: (u as any)?.email || "",
          ownerPhone: (u as any)?.phone || "",
          createdAt: p.createdAt,
        };
      }),
    );
  },
});

/** Admin: verify / un-verify a local service provider. */
export const adminVerifyProvider = mutation({
  args: { providerId: v.id("serviceProfiles"), verified: v.boolean(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const p = await ctx.db.get(args.providerId);
    if (!p) throw new ConvexError("Provider not found");
    await ctx.db.patch(args.providerId, {
      adminVerified: args.verified,
      verificationNote: args.note,
      updatedAt: Date.now(),
    });
    await notify(
      ctx,
      (p as any).userId,
      args.verified ? "✅ Service verified" : "Service verification removed",
      args.verified
        ? `Nexora verified "${(p as any).displayName}". You now carry the verified badge.`
        : `Verification was removed from "${(p as any).displayName}". ${args.note || ""}`,
      "/services/dashboard",
    );
    return { success: true, by: admin._id };
  },
});

/**
 * Internal repair (server/CLI only): recompute provider aggregates from real
 * completed requests so counters can never drift.
 */
export const internalRecomputeProviderStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("serviceProfiles").collect();
    let touched = 0;
    for (const p of profiles) {
      const completed = await ctx.db
        .query("serviceRequests")
        .withIndex("by_provider" as any, (q: any) => q.eq("providerId", p._id))
        .collect();
      const done = completed.filter((r: any) => r.status === "completed");
      const rated = done.filter((r: any) => r.rating);
      const patch: Record<string, any> = { completedJobs: done.length };
      patch.ratingSum = rated.reduce((s: number, r: any) => s + r.rating, 0);
      patch.ratingCount = rated.length;
      await ctx.db.patch(p._id, patch);
      touched += 1;
    }
    return { providers: touched };
  },
});
