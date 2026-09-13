import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Phase 2: Community Requests (#88/#89) ──────────────────────────────────
// Demand-first matching: a buyer posts what they need ("second-hand fridge in
// Nyeri under KSh 20,000", "wedding photographer in Embu next Saturday") and
// relevant sellers/providers respond with offers. The buyer compares offers
// with verification visible and picks — demand converts into supply.

async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email))
    .first();
  if (!user) throw new Error("Account profile not found");
  if ((user as any).accountStatus === "suspended") {
    throw new Error("Your account is suspended — request features are disabled.");
  }
  return user;
}

/** In-app notification for the request/offer lifecycle (best-effort). */
async function notify(ctx: any, userId: any, title: string, body: string, link: string) {
  try {
    await ctx.db.insert("notifications", {
      userId,
      type: "community",
      title,
      message: body,
      link,
      read: false,
      createdAt: Date.now(),
    });
  } catch {
    // Never let a notification failure break the request flow.
  }
}

const MAX_OPEN_PER_USER = 5;
const MAX_OFFERS_PER_REQUEST = 30;

/** Buyer: post what you need. */
export const createRequest = mutation({
  args: {
    title: v.string(),
    details: v.optional(v.string()),
    kind: v.union(v.literal("product"), v.literal("service"), v.literal("procurement")),
    // Bulk needs (#64): "500 × 50kg cement", "100 office chairs".
    category: v.optional(v.string()),
    county: v.optional(v.string()),
    town: v.optional(v.string()),
    budget: v.optional(v.number()),
    neededBy: v.optional(v.string()),
    quantity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const title = args.title.trim();
    if (title.length < 5) throw new Error("Describe what you need in at least 5 characters");
    if (title.length > 120) throw new Error("Keep the title under 120 characters");

    // Anti-spam: cap open requests per account (#81 fraud patterns).
    const mine = await ctx.db
      .query("communityRequests")
      .withIndex("by_customer" as any, (q: any) => q.eq("customerId", user._id))
      .collect();
    const open = mine.filter((r: any) => r.status === "open");
    if (open.length >= MAX_OPEN_PER_USER) {
      throw new Error(`You have ${open.length} open requests — close one before posting another`);
    }

    const now = Date.now();
    const id = await ctx.db.insert("communityRequests", {
      customerId: user._id,
      title,
      details: args.details?.trim() || undefined,
      kind: args.kind,
      quantity: args.quantity?.trim() || undefined,
      category: args.category?.trim() || undefined,
      county: args.county?.trim() || undefined,
      town: args.town?.trim() || undefined,
      budget: args.budget && args.budget > 0 ? Math.round(args.budget) : undefined,
      neededBy: args.neededBy?.trim() || undefined,
      status: "open" as const,
      offerCount: 0,
      createdAt: now,
    });
    return { requestId: id };
  },
});

/** Public feed: open requests, newest first. */
export const listOpenRequests = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("communityRequests")
      .withIndex("by_status" as any, (q: any) => q.eq("status", "open"))
      .order("desc")
      .take(args.limit ?? 60);
    return Promise.all(
      rows.map(async (r: any) => {
        const u = await ctx.db.get(r.customerId);
        return {
          _id: r._id,
          title: r.title,
          details: r.details,
          kind: r.kind,
          category: r.category,
          county: r.county,
          town: r.town,
          budget: r.budget,
          neededBy: r.neededBy,
          quantity: r.quantity,
          offerCount: r.offerCount ?? 0,
          createdAt: r.createdAt,
          customerName: (u as any)?.name || "Nexora member",
        };
      }),
    );
  },
});

/** My own requests (buyer side) with live offer counts. */
export const listMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("communityRequests")
      .withIndex("by_customer" as any, (q: any) => q.eq("customerId", user._id))
      .order("desc")
      .collect();
    return Promise.all(
      rows.map(async (r: any) => {
        const offers = await ctx.db
          .query("requestOffers")
          .withIndex("by_request" as any, (q: any) => q.eq("requestId", r._id))
          .collect();
        return { ...r, offerCount: offers.filter((o: any) => o.status === "pending").length };
      }),
    );
  },
});

/** Offers on one of my requests — only the request owner can read them. */
export const listOffersForMyRequest = query({
  args: { requestId: v.id("communityRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || (request as any).customerId !== user._id) {
      throw new Error("Not authorized");
    }
    const offers = await ctx.db
      .query("requestOffers")
      .withIndex("by_request" as any, (q: any) => q.eq("requestId", args.requestId))
      .collect();
    return offers.sort((a: any, b: any) => a.amount - b.amount);
  },
});

/** Seller/provider: respond to an open request with a priced offer. */
export const submitOffer = mutation({
  args: {
    requestId: v.id("communityRequests"),
    amount: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.amount <= 0) throw new Error("Enter a valid price");
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    const r = request as any;
    if (r.status !== "open") throw new Error("This request is no longer open");
    if (r.customerId === user._id) throw new Error("You cannot offer on your own request");

    // One offer per responder per request — edit yours instead of spamming.
    const existing = await ctx.db
      .query("requestOffers")
      .withIndex("by_request" as any, (q: any) => q.eq("requestId", args.requestId))
      .collect();
    if (existing.length >= MAX_OFFERS_PER_REQUEST) {
      throw new Error("This request has enough offers for now");
    }
    const mine = existing.find((o: any) => o.responderId === user._id);
    const verified = !!(user as any).kycVerified || (user as any).verificationLevel === "business";

    if (mine) {
      await ctx.db.patch(mine._id, {
        amount: Math.round(args.amount),
        message: args.message?.trim() || undefined,
        responderVerified: verified,
        status: "pending" as const,
      });
    } else {
      await ctx.db.insert("requestOffers", {
        requestId: args.requestId,
        responderId: user._id,
        responderName: (user as any).businessName || (user as any).name || "Seller",
        amount: Math.round(args.amount),
        message: args.message?.trim() || undefined,
        responderVerified: verified,
        status: "pending" as const,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.requestId, { offerCount: (existing.length ?? 0) + 1 });
    }

    await notify(
      ctx,
      r.customerId,
      "New offer on your request",
      `"${r.title}" received a KES ${Math.round(args.amount).toLocaleString()} offer from ${(user as any).businessName || (user as any).name || "a seller"}.`,
      "/community",
    );
    return { success: true };
  },
});

/** Buyer: accept an offer → request closes and both sides get a handoff. */
export const acceptOffer = mutation({
  args: { offerId: v.id("requestOffers") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new Error("Offer not found");
    const o = offer as any;
    const request = await ctx.db.get(o.requestId);
    if (!request) throw new Error("Request not found");
    const r = request as any;
    if (r.customerId !== user._id) throw new Error("Not authorized");
    if (r.status !== "open") throw new Error("This request is already closed");
    if (o.status !== "pending") throw new Error("This offer is no longer available");

    await ctx.db.patch(o.requestId, { status: "awarded" as const, awardedOfferId: o._id, updatedAt: Date.now() });
    await ctx.db.patch(o._id, { status: "accepted" as const });
    // Decline the rest so the feed stays honest.
    const siblings = await ctx.db
      .query("requestOffers")
      .withIndex("by_request" as any, (q: any) => q.eq("requestId", o.requestId))
      .collect();
    for (const sib of siblings) {
      if ((sib as any)._id !== o._id && (sib as any).status === "pending") {
        await ctx.db.patch((sib as any)._id, { status: "declined" as const });
      }
    }

    await notify(
      ctx,
      o.responderId,
      "🎉 Your offer was accepted",
      `${(user as any).name || "The buyer"} accepted your KES ${o.amount.toLocaleString()} offer for "${r.title}". Chat to arrange payment through Nexora escrow.`,
      "/chat",
    );
    return { success: true, responderId: o.responderId };
  },
});

/** Buyer: close/withdraw my request. */
export const closeRequest = mutation({
  args: { requestId: v.id("communityRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || (request as any).customerId !== user._id) throw new Error("Not authorized");
    await ctx.db.patch(args.requestId, { status: "closed" as const, updatedAt: Date.now() });
    return { success: true };
  },
});

/** Requests open in a county (used by the homepage demand strip). */
export const listRequestsByCounty = query({
  args: { county: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("communityRequests")
      .withIndex("by_status" as any, (q: any) => q.eq("status", "open"))
      .order("desc")
      .take(args.limit ?? 40);
    return rows.filter((r: any) => (r.county || "").toLowerCase() === args.county.toLowerCase());
  },
});
